// Prochain match de l'accueil (T019a, FR-025) — module autonome, sans dépendance envers
// src/lib/competitions.ts.
import { asc, gt } from "drizzle-orm";
import { competition } from "../../drizzle/schema";
import type { Db } from "./db";

export type NextCompetition = {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string | null;
};

export type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

/** Première compétition dont la date est strictement postérieure à `now`, `null` sinon. */
export async function getNextCompetition(
  db: Db,
  now: Date = new Date(),
): Promise<NextCompetition | null> {
  const [row] = await db
    .select()
    .from(competition)
    .where(gt(competition.date, now))
    .orderBy(asc(competition.date))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    date: row.date.toISOString(),
    location: row.location,
    description: row.description ?? null,
  };
}

/** Même règle que getNextCompetition, sur une liste en mémoire. */
export function pickNextCompetition<T extends { date: string | Date }>(
  items: T[],
  now: Date = new Date(),
): T | null {
  return (
    items
      .filter((c) => new Date(c.date).getTime() > now.getTime())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
  );
}

/** Temps restant avant `target`, borné à zéro : jamais de valeur négative. */
export function timeRemaining(target: Date | string, now: Date = new Date()): TimeRemaining {
  const totalMs = Math.max(0, new Date(target).getTime() - now.getTime());
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}
