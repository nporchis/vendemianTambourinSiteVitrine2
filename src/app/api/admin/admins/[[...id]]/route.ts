// GET/POST/PATCH/DELETE /api/admin/admins[/{id}] (T026, contracts/admin-api.md) — jamais le hash
// de mot de passe en lecture ; garde « dernier compte actif » (FR-004) ; journal d'audit (FR-017).
import { and, eq, ne } from "drizzle-orm";
import { admin } from "../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { parseJsonBody, requireAdminOrResponse } from "@/lib/auth/admin-route";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForAdmin } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit-log";
import { createDb, getEnv } from "@/lib/db";
import { AdminCreateSchema, AdminUpdateSchema, fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

type AdminDto = { id: string; email: string; active: boolean; createdAt: string };

function toDto(row: typeof admin.$inferSelect): AdminDto {
  return { id: row.id, email: row.email, active: row.active, createdAt: row.createdAt.toISOString() };
}

function idFrom(context: { params: Promise<{ id?: string[] }> }) {
  return context.params.then(({ id }) => id?.[0]);
}

async function countOtherActive(db: ReturnType<typeof createDb>, excludeId: string) {
  const rows = await db
    .select({ id: admin.id })
    .from(admin)
    .where(and(eq(admin.active, true), ne(admin.id, excludeId)));
  return rows.length;
}

export async function GET(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const rows = await db.select().from(admin);
  return jsonOk(rows.map(toDto));
}

export async function POST(request: Request) {
  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = AdminCreateSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [existing] = await db.select().from(admin).where(eq(admin.email, parsed.data.email)).limit(1);
  if (existing) return jsonError({ email: "Un compte existe déjà avec cet email." }, 409);

  const [row] = await db
    .insert(admin)
    .values({ email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) })
    .returning();
  await writeAuditLog(db, { actorAdminId: guard.admin.id, action: "admin_created", targetAdminId: row.id });
  return jsonOk(toDto(row), 201);
}

export async function PATCH(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = await idFrom(context);
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const parsed = AdminUpdateSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);

  const [current] = await db.select().from(admin).where(eq(admin.id, id)).limit(1);
  if (!current) return jsonError({ form: "Compte introuvable." }, 404);

  const deactivating = parsed.data.active === false && current.active;
  if (deactivating && (await countOtherActive(db, id)) === 0) {
    return jsonError({ active: "Impossible de désactiver le dernier compte actif." }, 409);
  }

  const values: { active?: boolean; passwordHash?: string } = {};
  if (parsed.data.active !== undefined) values.active = parsed.data.active;
  if (parsed.data.password) values.passwordHash = await hashPassword(parsed.data.password);

  const [row] = await db.update(admin).set(values).where(eq(admin.id, id)).returning();

  const reactivating = parsed.data.active === true && !current.active;
  const action = deactivating ? "admin_deactivated" : reactivating ? "admin_reactivated" : "admin_updated";
  await writeAuditLog(db, { actorAdminId: guard.admin.id, action, targetAdminId: id });

  if (deactivating) await revokeAllSessionsForAdmin(db, id);

  return jsonOk(toDto(row));
}

export async function DELETE(request: Request, context: { params: Promise<{ id?: string[] }> }) {
  const id = await idFrom(context);
  if (!id) return jsonError({ form: "Identifiant manquant." }, 400);

  const db = createDb((await getEnv()).DB);
  const guard = await requireAdminOrResponse(db, request);
  if ("response" in guard) return guard.response;

  const [current] = await db.select().from(admin).where(eq(admin.id, id)).limit(1);
  if (!current) return new Response(null, { status: 204 });

  if (current.active && (await countOtherActive(db, id)) === 0) {
    return jsonError({ form: "Impossible de supprimer le dernier compte actif." }, 409);
  }

  await revokeAllSessionsForAdmin(db, id);
  // Écrit avant la suppression : `admin_audit_log.target_admin_id` référence `admin(id)`.
  await writeAuditLog(db, { actorAdminId: guard.admin.id, action: "admin_deleted", targetAdminId: id });
  await db.delete(admin).where(eq(admin.id, id));
  return new Response(null, { status: 204 });
}
