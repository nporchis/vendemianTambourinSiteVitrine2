// Partenaires triés par niveau puis ordre d'affichage (FR-005).
import { asc } from "drizzle-orm";
import { PARTNER_LEVELS, partner, type PartnerLevel } from "../../drizzle/schema";
import type { Db } from "./db";

export { PARTNER_LEVELS, type PartnerLevel };

export type PartnerDto = {
  id: string;
  name: string;
  level: PartnerLevel;
  websiteUrl: string | null;
  description: string | null;
  logoUrl: string | null;
};

export const PARTNER_LEVEL_LABELS: Record<PartnerLevel, string> = {
  principal: "Partenaires principaux",
  soutien: "Soutiens",
  institutionnel: "Institutionnels",
};

export async function listPartners(db: Db): Promise<PartnerDto[]> {
  const rows = await db.select().from(partner).orderBy(asc(partner.sortOrder));
  // Tri stable : niveau d'abord, l'ordre SQL (sortOrder) départage.
  return rows
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        PARTNER_LEVELS.indexOf(a.row.level) - PARTNER_LEVELS.indexOf(b.row.level) ||
        a.index - b.index,
    )
    .map(({ row }) => ({
      id: row.id,
      name: row.name,
      level: row.level,
      websiteUrl: row.websiteUrl ?? null,
      description: row.description ?? null,
      logoUrl: row.logoUrl ?? null,
    }));
}

/** Groupes non vides, dans l'ordre principal → soutien → institutionnel. */
export function groupPartnersByLevel(partners: PartnerDto[]) {
  return PARTNER_LEVELS.map((level) => ({
    level,
    partners: partners.filter((p) => p.level === level),
  })).filter((group) => group.partners.length > 0);
}
