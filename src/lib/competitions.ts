// Statut et tri des compétitions (T025) : le statut est dérivé de la date, jamais stocké.
import { desc } from "drizzle-orm";
import { competition } from "../../drizzle/schema";
import type { Db } from "./db";

export type CompetitionStatus = "upcoming" | "past";

export type CompetitionDto = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string | null;
  result: string | null;
  status: CompetitionStatus;
};

type CompetitionRow = typeof competition.$inferSelect;

/** `upcoming` si la compétition commence maintenant ou plus tard, `past` sinon. */
export function competitionStatus(date: Date, now: Date = new Date()): CompetitionStatus {
  return date.getTime() >= now.getTime() ? "upcoming" : "past";
}

/** Le résultat n'est exposé que pour une compétition passée (FR-016). */
export function toCompetitionDto(row: CompetitionRow, now: Date = new Date()): CompetitionDto {
  const status = competitionStatus(row.date, now);
  return {
    id: row.id,
    name: row.name,
    date: row.date.toISOString(),
    location: row.location,
    description: row.description ?? null,
    result: status === "past" ? (row.result ?? null) : null,
    status,
  };
}

export function sortByDateDesc<T extends { date: string | Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** À venir du plus proche au plus lointain, passées du plus récent au plus ancien. */
export function splitCompetitions(items: CompetitionDto[]) {
  const sorted = sortByDateDesc(items);
  return {
    upcoming: sorted.filter((c) => c.status === "upcoming").reverse(),
    past: sorted.filter((c) => c.status === "past"),
  };
}

export async function listCompetitions(db: Db, now: Date = new Date()): Promise<CompetitionDto[]> {
  const rows = await db.select().from(competition).orderBy(desc(competition.date));
  return rows.map((row) => toCompetitionDto(row, now));
}
