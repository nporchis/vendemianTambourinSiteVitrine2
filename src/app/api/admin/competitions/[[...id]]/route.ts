// POST/PATCH/DELETE /api/admin/competitions[/{id}] (T022, contracts/admin-api.md).
import { eq } from "drizzle-orm";
import { competition } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { toCompetitionDto } from "@/lib/competitions";
import { createDb, getEnv } from "@/lib/db";
import { CompetitionSchema, fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

function idFrom(context: { params: Promise<{ id?: string[] }> }) {
  return context.params.then(({ id }) => id?.[0]);
}

export async function POST(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = CompetitionSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [row] = await db
    .insert(competition)
    .values({
      name: parsed.data.name,
      date: parsed.data.date,
      location: parsed.data.location,
      description: parsed.data.description ?? null,
      result: parsed.data.result ?? null,
    })
    .returning();
  return jsonOk(toCompetitionDto(row), 201);
}

export async function PATCH(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = await idFrom(context);
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = CompetitionSchema.partial().safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [row] = await db
    .update(competition)
    .set(parsed.data)
    .where(eq(competition.id, id))
    .returning();
  if (!row) return jsonError({ form: "Compétition introuvable." }, 404);
  return jsonOk(toCompetitionDto(row));
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = await idFrom(context);
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  await db.delete(competition).where(eq(competition.id, id));
  return new Response(null, { status: 204 });
}
