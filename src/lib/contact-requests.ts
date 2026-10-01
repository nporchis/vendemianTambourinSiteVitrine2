// Lecture des demandes de contact pour le backoffice (T045).
import { desc } from "drizzle-orm";
import { contactRequest } from "../../drizzle/schema";
import type { Db } from "./db";

export type ContactRequestDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
  processedAt: string | null;
};

export async function listContactRequests(db: Db): Promise<ContactRequestDto[]> {
  const rows = await db.select().from(contactRequest).orderBy(desc(contactRequest.submittedAt));
  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    subject: row.subject,
    message: row.message,
    submittedAt: row.submittedAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
  }));
}
