// Purge planifiée des demandes de contact (T051, FR-014) : supprime les demandes dont la
// date de purge (envoi + 12 mois) est atteinte. Déclenchée par le Cron Trigger de
// wrangler.toml via le handler `scheduled` de custom-worker.ts.
import { lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { contactRequest } from "../../drizzle/schema";

/** Date de purge d'une demande : 12 mois après son envoi. */
export function computePurgeAt(submittedAt: Date): Date {
  const purgeAt = new Date(submittedAt);
  purgeAt.setUTCMonth(purgeAt.getUTCMonth() + 12);
  return purgeAt;
}

/** Supprime les demandes arrivées à échéance et renvoie leur nombre. */
export async function purgeExpiredContactRequests(
  d1: D1Database,
  now: Date = new Date(),
): Promise<number> {
  const deleted = await drizzle(d1)
    .delete(contactRequest)
    .where(lte(contactRequest.purgeAt, now))
    .returning({ id: contactRequest.id });
  console.info(`[purge] ${deleted.length} demande(s) de contact supprimée(s)`);
  return deleted.length;
}
