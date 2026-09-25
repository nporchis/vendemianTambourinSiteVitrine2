// T023 — statut dérivé des compétitions (FR-003, FR-016)
import { describe, expect, it } from "vitest";
import {
  competitionStatus,
  splitCompetitions,
  toCompetitionDto,
  type CompetitionDto,
} from "@/lib/competitions";

const now = new Date("2026-10-01T10:00:00.000Z");

const row = (date: string, result: string | null = "Victoire 13–7") => ({
  id: date,
  name: "Match",
  date: new Date(date),
  location: "Fronton",
  description: null,
  result,
});

describe("competitionStatus", () => {
  it("renvoie upcoming pour une date future ou égale à maintenant", () => {
    expect(competitionStatus(new Date("2026-10-02T00:00:00Z"), now)).toBe("upcoming");
    expect(competitionStatus(now, now)).toBe("upcoming");
  });

  it("renvoie past pour une date passée", () => {
    expect(competitionStatus(new Date("2026-09-30T23:59:59Z"), now)).toBe("past");
  });
});

describe("toCompetitionDto", () => {
  it("expose le résultat d'une compétition passée", () => {
    const dto = toCompetitionDto(row("2026-09-20T13:00:00Z"), now);
    expect(dto).toMatchObject({ status: "past", result: "Victoire 13–7" });
    expect(dto.date).toBe("2026-09-20T13:00:00.000Z");
  });

  it("n'expose jamais le résultat d'une compétition à venir", () => {
    expect(toCompetitionDto(row("2026-10-12T13:00:00Z"), now)).toMatchObject({
      status: "upcoming",
      result: null,
    });
  });

  it("renvoie null pour une compétition passée sans résultat", () => {
    expect(toCompetitionDto(row("2026-09-20T13:00:00Z", null), now).result).toBeNull();
  });
});

describe("splitCompetitions", () => {
  it("trie les à venir du plus proche au plus lointain et les passées du plus récent", () => {
    const list: CompetitionDto[] = [
      "2026-06-08T13:00:00Z",
      "2026-11-02T13:00:00Z",
      "2026-09-21T13:00:00Z",
      "2026-10-12T13:00:00Z",
    ].map((d) => toCompetitionDto(row(d), now));
    const { upcoming, past } = splitCompetitions(list);
    expect(upcoming.map((c) => c.date.slice(0, 10))).toEqual(["2026-10-12", "2026-11-02"]);
    expect(past.map((c) => c.date.slice(0, 10))).toEqual(["2026-09-21", "2026-06-08"]);
  });
});
