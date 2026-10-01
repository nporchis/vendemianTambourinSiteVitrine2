// POST/DELETE /api/admin/photo-categories[/{id}] (T030, contracts/admin-api.md).
import { eq } from "drizzle-orm";
import { photoCategory } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { createDb, getEnv } from "@/lib/db";
import { PhotoCategorySchema, fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = PhotoCategorySchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [existing] = await db
    .select()
    .from(photoCategory)
    .where(eq(photoCategory.name, parsed.data.name))
    .limit(1);
  if (existing) return jsonOk(existing, 200);

  const [row] = await db.insert(photoCategory).values({ name: parsed.data.name }).returning();
  return jsonOk(row, 201);
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  try {
    await db.delete(photoCategory).where(eq(photoCategory.id, id));
  } catch {
    return jsonError({ form: "Catégorie utilisée par des photos, suppression impossible." }, 409);
  }
  return new Response(null, { status: 204 });
}
