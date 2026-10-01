// GET/PATCH/DELETE /api/admin/contact-requests[/{id}] (T044, contracts/admin-api.md) — PATCH
// idempotent (`processedAt` renseigné une seule fois), DELETE immédiat et manuel (FR-014),
// indépendant de la purge automatique à 12 mois.
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { contactRequest } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { createDb, getEnv } from "@/lib/db";
import { fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

const PatchSchema = z.object({ processed: z.literal(true) });

export async function GET(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const rows = await db.select().from(contactRequest).orderBy(desc(contactRequest.submittedAt));
  return jsonOk(rows);
}

export async function PATCH(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = PatchSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [current] = await db.select().from(contactRequest).where(eq(contactRequest.id, id)).limit(1);
  if (!current) return jsonError({ form: "Demande introuvable." }, 404);

  const [row] = current.processedAt
    ? [current]
    : await db
        .update(contactRequest)
        .set({ processedAt: new Date() })
        .where(eq(contactRequest.id, id))
        .returning();
  return jsonOk(row);
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = (await context.params).id?.[0];
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  await db.delete(contactRequest).where(eq(contactRequest.id, id));
  return new Response(null, { status: 204 });
}
