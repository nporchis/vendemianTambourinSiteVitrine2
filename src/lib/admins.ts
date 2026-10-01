// Lecture des comptes administrateur (T027) — jamais le hash de mot de passe.
import { admin } from "../../drizzle/schema";
import type { Db } from "./db";

export type AdminDto = { id: string; email: string; active: boolean; createdAt: string };

export async function listAdmins(db: Db): Promise<AdminDto[]> {
  const rows = await db.select().from(admin);
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  }));
}
