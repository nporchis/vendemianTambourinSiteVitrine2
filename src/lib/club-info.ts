// Informations du club (singleton) + membres du bureau (FR-002, FR-024, FR-026).
import { asc } from "drizzle-orm";
import { boardMember, clubInfo, type KeyFigure, type SocialLink } from "../../drizzle/schema";
import type { Db } from "./db";

export type BoardMemberDto = {
  id: string;
  firstName: string;
  lastNameInitial: string;
  role: string;
};

export type ClubInfoDto = {
  historyText: string;
  values: string;
  teamInfo: string | null;
  keyFigures: KeyFigure[];
  boardMembers: BoardMemberDto[];
  contactEmail: string;
  contactPhone: string | null;
  socialLinks: SocialLink[];
};

/** `null` tant que le club n'a pas saisi ses informations. */
export async function getClubInfo(db: Db): Promise<ClubInfoDto | null> {
  const [[info], members] = await Promise.all([
    db.select().from(clubInfo).limit(1),
    db
      .select({
        id: boardMember.id,
        firstName: boardMember.firstName,
        lastNameInitial: boardMember.lastNameInitial,
        role: boardMember.role,
      })
      .from(boardMember)
      .orderBy(asc(boardMember.sortOrder)),
  ]);
  if (!info) return null;
  return {
    historyText: info.historyText,
    values: info.values,
    teamInfo: info.teamInfo ?? null,
    keyFigures: (info.keyFigures ?? []).slice(0, 4),
    boardMembers: members,
    contactEmail: info.contactEmail,
    contactPhone: info.contactPhone ?? null,
    socialLinks: info.socialLinks ?? [],
  };
}

/** « Jean-Marc R. » (FR-026). */
export function boardMemberName(member: Pick<BoardMemberDto, "firstName" | "lastNameInitial">) {
  return `${member.firstName} ${member.lastNameInitial.toUpperCase()}.`;
}

/** Paragraphes d'un texte libre, séparés par une ligne vide. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type ClubValue = { title: string | null; text: string };

/**
 * Valeurs du club : un paragraphe par valeur. « Titre : texte » donne une carte titrée
 * comme sur la maquette ; sinon le paragraphe est affiché seul.
 */
export function parseValues(text: string): ClubValue[] {
  return paragraphs(text).map((p) => {
    const match = p.match(/^([^:\n]{1,40}?)\s*:\s+([\s\S]+)$/);
    return match ? { title: match[1].trim(), text: match[2].trim() } : { title: null, text: p };
  });
}
