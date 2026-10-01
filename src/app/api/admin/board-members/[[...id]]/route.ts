// POST/PATCH/DELETE /api/admin/board-members[/{id}] (T036, contracts/admin-api.md) — nouvel
// ajout en fin de liste (`sortOrder` = max + 1), ordre déjà lu par le front public.
import { desc, eq } from "drizzle-orm";
import { boardMember } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { createDb, getEnv } from "@/lib/db";
import { BoardMemberSchema, fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = BoardMemberSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [last] = await db.select().from(boardMember).orderBy(desc(boardMember.sortOrder)).limit(1);
  const [row] = await db
    .insert(boardMember)
    .values({ ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 })
    .returning();
  return jsonOk(row, 201);
}

export async function PATCH(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = BoardMemberSchema.partial().safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [row] = await db.update(boardMember).set(parsed.data).where(eq(boardMember.id, id)).returning();
  if (!row) return jsonError({ form: "Membre introuvable." }, 404);
  return jsonOk(row);
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  await db.delete(boardMember).where(eq(boardMember.id, id));
  return new Response(null, { status: 204 });
}
