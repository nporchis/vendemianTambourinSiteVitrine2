// Sessions administrateur (T006, data-model.md « AdminSession ») : jeton haute entropie envoyé
// en cookie, seul son hash SHA-256 est persisté en base.
import { eq } from "drizzle-orm";
import { admin, adminSession } from "../../../drizzle/schema";
import type { Db } from "../db";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const SESSION_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthenticatedAdmin = { id: string; email: string };

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Crée une session et retourne le jeton en clair, à poser en cookie (jamais persisté tel quel). */
export async function createSession(db: Db, adminId: string): Promise<string> {
  const token = generateToken();
  await db.insert(adminSession).values({
    adminId,
    tokenHash: await sha256Hex(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

/**
 * Valide le jeton de session : hash trouvé, non expiré, compte associé actif. Prolonge
 * `expiresAt` de 24h à chaque requête authentifiée, plafonné à 30 jours depuis `createdAt`.
 */
export async function validateSession(
  db: Db,
  token: string | undefined | null,
): Promise<AuthenticatedAdmin | null> {
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const now = new Date();

  const [row] = await db
    .select({
      sessionId: adminSession.id,
      createdAt: adminSession.createdAt,
      expiresAt: adminSession.expiresAt,
      adminId: admin.id,
      email: admin.email,
      active: admin.active,
    })
    .from(adminSession)
    .innerJoin(admin, eq(adminSession.adminId, admin.id))
    .where(eq(adminSession.tokenHash, tokenHash))
    .limit(1);

  if (!row || !row.active || row.expiresAt.getTime() <= now.getTime()) return null;

  const maxExpiry = row.createdAt.getTime() + SESSION_MAX_LIFETIME_MS;
  const nextExpiry = Math.min(now.getTime() + SESSION_TTL_MS, maxExpiry);
  if (nextExpiry > row.expiresAt.getTime()) {
    await db
      .update(adminSession)
      .set({ expiresAt: new Date(nextExpiry) })
      .where(eq(adminSession.id, row.sessionId));
  }

  return { id: row.adminId, email: row.email };
}

export async function revokeSession(db: Db, token: string): Promise<void> {
  await db.delete(adminSession).where(eq(adminSession.tokenHash, await sha256Hex(token)));
}

export async function revokeAllSessionsForAdmin(db: Db, adminId: string): Promise<void> {
  await db.delete(adminSession).where(eq(adminSession.adminId, adminId));
}
