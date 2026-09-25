// T016a — compte à rebours et sélection du prochain match (FR-025)
import { describe, expect, it } from "vitest";
import { pickNextCompetition, timeRemaining } from "@/lib/next-competition";

const now = new Date("2026-10-01T10:00:00.000Z");

describe("timeRemaining", () => {
  it("décompose le temps restant en jours, heures, minutes et secondes", () => {
    const target = new Date("2026-10-03T13:04:05.000Z");
    expect(timeRemaining(target, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      totalMs: ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000,
    });
  });

  it("ignore les millisecondes restantes (arrondi à la seconde inférieure)", () => {
    const target = new Date(now.getTime() + 1_999);
    expect(timeRemaining(target, now)).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 1 });
  });

  it("est borné à zéro quand l'heure du match est atteinte ou dépassée", () => {
    for (const target of [now, new Date(now.getTime() - 90_000_000)]) {
      expect(timeRemaining(target, now)).toEqual({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
      });
    }
  });

  it("accepte une date ISO", () => {
    expect(timeRemaining("2026-10-01T11:00:00.000Z", now).hours).toBe(1);
  });
});

describe("pickNextCompetition", () => {
  const competitions = [
    { name: "passée", date: "2026-09-20T13:00:00.000Z" },
    { name: "lointaine", date: "2026-12-01T13:00:00.000Z" },
    { name: "prochaine", date: "2026-10-12T13:00:00.000Z" },
  ];

  it("retient la première compétition à venir, par date croissante", () => {
    expect(pickNextCompetition(competitions, now)?.name).toBe("prochaine");
  });

  it("n'en retient aucune si toutes sont passées", () => {
    expect(pickNextCompetition(competitions, new Date("2027-01-01"))).toBeNull();
  });

  it("exclut une compétition qui commence exactement maintenant", () => {
    expect(pickNextCompetition([{ date: now.toISOString() }], now)).toBeNull();
  });
});
