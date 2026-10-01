// Journal d'audit des comptes administrateur (FR-017, data-model.md « AdminAuditLog ») — écriture
// seule (append-only), jamais modifié ni supprimé par le backoffice.
import { desc } from "drizzle-orm";
import { admin, adminAuditLog, type AdminAuditAction } from "../../drizzle/schema";
import type { Db } from "./db";

export async function writeAuditLog(
  db: Db,
  entry: { actorAdminId: string; action: AdminAuditAction; targetAdminId?: string | null },
): Promise<void> {
  await db.insert(adminAuditLog).values({
    actorAdminId: entry.actorAdminId,
    action: entry.action,
    targetAdminId: entry.targetAdminId ?? null,
  });
}

export type AuditLogEntryDto = {
  id: string;
  actorEmail: string | null;
  action: AdminAuditAction;
  targetEmail: string | null;
  createdAt: string;
};

/**
 * Lecture seule pour l'écran « Comptes ». Résout les emails via une carte à part (plutôt qu'une
 * jointure) : un acteur ou une cible supprimé·e depuis reste visible dans le journal, email `null`.
 */
export async function listAuditLog(db: Db): Promise<AuditLogEntryDto[]> {
  const rows = await db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt));
  const admins = await db.select({ id: admin.id, email: admin.email }).from(admin);
  const emailById = new Map(admins.map((a) => [a.id, a.email]));

  return rows.map((row) => ({
    id: row.id,
    actorEmail: row.actorAdminId ? (emailById.get(row.actorAdminId) ?? null) : null,
    action: row.action,
    targetEmail: row.targetAdminId ? (emailById.get(row.targetAdminId) ?? null) : null,
    createdAt: row.createdAt.toISOString(),
  }));
}
