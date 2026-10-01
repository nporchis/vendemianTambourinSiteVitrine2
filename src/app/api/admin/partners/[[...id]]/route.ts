// POST/PATCH/DELETE /api/admin/partners[/{id}] (T040, contracts/admin-api.md) — `multipart/form-data`
// si un logo est joint (`putMediaObject` sur le préfixe `logos/`).
import { eq } from "drizzle-orm";
import { z } from "zod";
import { partner, PARTNER_LEVELS } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { createDb, getEnv } from "@/lib/db";
import { deleteMediaObject, putMediaObject, validateMediaFile } from "@/lib/media-storage";
import { fieldErrors, requiredString } from "@/lib/validation";

export const dynamic = "force-dynamic";

const PartnerMetadataSchema = z.object({
  name: requiredString(),
  level: z.enum(PARTNER_LEVELS, { error: "Niveau inconnu." }),
  websiteUrl: z.string().trim().nullish(),
  description: z.string().max(120, "120 caractères au plus.").nullish(),
});

function fileErrorMessage(error: "too-large" | "unsupported-type") {
  return error === "too-large"
    ? "Le fichier dépasse la taille maximale de 10 Mo."
    : "Format non supporté (JPEG, PNG ou WebP uniquement).";
}

async function readMultipart(request: Request) {
  const form = await request.formData();
  const file = form.get("logo");
  return {
    file: file instanceof File && file.size > 0 ? file : null,
    fields: {
      name: form.get("name"),
      level: form.get("level"),
      websiteUrl: form.get("websiteUrl") || null,
      description: form.get("description") || null,
    },
  };
}

export async function POST(request: Request) {
  const env = await getEnv();
  const db = createDb(env.DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const { file, fields } = await readMultipart(request);
  const parsed = PartnerMetadataSchema.safeParse(fields);
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  let logoUrl: string | null = null;
  if (file) {
    const fileError = validateMediaFile(file);
    if (fileError) {
      return jsonError({ file: fileErrorMessage(fileError) }, fileError === "too-large" ? 413 : 415);
    }
    logoUrl = await putMediaObject(env.MEDIA_BUCKET, "logos", file);
  }

  const existingSortOrders = await db.select({ s: partner.sortOrder }).from(partner);
  const nextSortOrder = existingSortOrders.length ? Math.max(...existingSortOrders.map((r) => r.s)) + 1 : 0;

  const [row] = await db
    .insert(partner)
    .values({
      name: parsed.data.name,
      level: parsed.data.level,
      websiteUrl: parsed.data.websiteUrl || null,
      description: parsed.data.description ?? null,
      logoUrl,
      sortOrder: nextSortOrder,
    })
    .returning();
  return jsonOk(row, 201);
}

export async function PATCH(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const env = await getEnv();
  const db = createDb(env.DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  const parsed = PartnerMetadataSchema.partial().safeParse(
    isMultipart ? (await readMultipart(request)).fields : await parseJsonBody(request),
  );
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [current] = await db.select().from(partner).where(eq(partner.id, id)).limit(1);
  if (!current) return jsonError({ form: "Partenaire introuvable." }, 404);

  let logoUrl: string | undefined;
  if (isMultipart) {
    const { file } = await readMultipart(request);
    if (file) {
      const fileError = validateMediaFile(file);
      if (fileError) {
        return jsonError({ file: fileErrorMessage(fileError) }, fileError === "too-large" ? 413 : 415);
      }
      if (current.logoUrl) await deleteMediaObject(env.MEDIA_BUCKET, current.logoUrl);
      logoUrl = await putMediaObject(env.MEDIA_BUCKET, "logos", file);
    }
  }

  const [row] = await db
    .update(partner)
    .set({
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.level !== undefined ? { level: parsed.data.level } : {}),
      ...(parsed.data.websiteUrl !== undefined ? { websiteUrl: parsed.data.websiteUrl || null } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
    })
    .where(eq(partner.id, id))
    .returning();
  return jsonOk(row);
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const env = await getEnv();
  const db = createDb(env.DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const [row] = await db.delete(partner).where(eq(partner.id, id)).returning();
  if (row?.logoUrl) await deleteMediaObject(env.MEDIA_BUCKET, row.logoUrl);
  return new Response(null, { status: 204 });
}
