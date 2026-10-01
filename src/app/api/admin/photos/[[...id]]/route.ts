// POST/PATCH/DELETE /api/admin/photos[/{id}] (T031, contracts/admin-api.md) — POST accepte
// `multipart/form-data` (fichier + categoryId + caption?), le champ `imageUrl` est déduit de
// l'upload, jamais saisi.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { photo } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { createDb, getEnv } from "@/lib/db";
import { deleteMediaObject, putMediaObject, validateMediaFile } from "@/lib/media-storage";
import { fieldErrors, requiredString } from "@/lib/validation";

export const dynamic = "force-dynamic";

const PhotoMetadataSchema = z.object({
  categoryId: requiredString("Catégorie requise."),
  caption: z.string().nullish(),
  takenOrEventDate: z.coerce.date().nullish(),
});

const PhotoUpdateSchema = PhotoMetadataSchema.partial();

function fileErrorMessage(error: "too-large" | "unsupported-type") {
  return error === "too-large"
    ? "Le fichier dépasse la taille maximale de 10 Mo."
    : "Format non supporté (JPEG, PNG ou WebP uniquement).";
}

export async function POST(request: Request) {
  const env = await getEnv();
  const db = createDb(env.DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError({ form: "Requête invalide." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError({ file: "Fichier requis." }, 400);

  const fileError = validateMediaFile(file);
  if (fileError) {
    return jsonError({ file: fileErrorMessage(fileError) }, fileError === "too-large" ? 413 : 415);
  }

  const parsed = PhotoMetadataSchema.safeParse({
    categoryId: form.get("categoryId"),
    caption: form.get("caption") || null,
    takenOrEventDate: form.get("takenOrEventDate") || null,
  });
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const imageUrl = await putMediaObject(env.MEDIA_BUCKET, "photos", file);
  const [row] = await db
    .insert(photo)
    .values({
      imageUrl,
      categoryId: parsed.data.categoryId,
      caption: parsed.data.caption ?? null,
      takenOrEventDate: parsed.data.takenOrEventDate ?? null,
    })
    .returning();
  return jsonOk(row, 201);
}

export async function PATCH(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = PhotoUpdateSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [row] = await db.update(photo).set(parsed.data).where(eq(photo.id, id)).returning();
  if (!row) return jsonError({ form: "Photo introuvable." }, 404);
  return jsonOk(row);
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const env = await getEnv();
  const db = createDb(env.DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const [row] = await db.delete(photo).where(eq(photo.id, id)).returning();
  if (row) await deleteMediaObject(env.MEDIA_BUCKET, row.imageUrl);
  return new Response(null, { status: 204 });
}
