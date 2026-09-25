// T017 — schéma Zod ClubInfo
import { describe, expect, it } from "vitest";
import { BoardMemberSchema, ClubInfoSchema } from "@/lib/validation";

const valid = {
  historyText: "Fondé en 1923.",
  values: "Transmettre : former les jeunes.",
  contactEmail: "contact@vendemian-tambourin.fr",
};

describe("ClubInfoSchema", () => {
  it("accepte des informations complètes", () => {
    const result = ClubInfoSchema.safeParse({
      ...valid,
      teamInfo: null,
      contactPhone: "06 12 34 56 78",
      socialLinks: [{ label: "Instagram", url: "https://www.instagram.com/" }],
      keyFigures: [{ value: "1923", label: "Fondation" }],
    });
    expect(result.success).toBe(true);
  });

  it("applique des tableaux vides par défaut", () => {
    const result = ClubInfoSchema.parse(valid);
    expect(result.socialLinks).toEqual([]);
    expect(result.keyFigures).toEqual([]);
  });

  it.each(["historyText", "values", "contactEmail"] as const)("rejette si %s manque", (field) => {
    const input: Record<string, unknown> = { ...valid };
    delete input[field];
    const result = ClubInfoSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([field]);
  });

  it.each(["", "   "])("rejette une histoire vide (%j)", (historyText) => {
    expect(ClubInfoSchema.safeParse({ ...valid, historyText }).success).toBe(false);
  });

  it.each(["contact", "contact@", "contact@club", "contact club@x.fr"])(
    "rejette l'email invalide %j",
    (contactEmail) => {
      expect(ClubInfoSchema.safeParse({ ...valid, contactEmail }).success).toBe(false);
    },
  );

  it("limite les chiffres clés à 4, de 8 caractères au plus", () => {
    const figure = { value: "1923", label: "Fondation" };
    expect(ClubInfoSchema.safeParse({ ...valid, keyFigures: Array(5).fill(figure) }).success).toBe(
      false,
    );
    expect(
      ClubInfoSchema.safeParse({ ...valid, keyFigures: [{ value: "123456789", label: "x" }] })
        .success,
    ).toBe(false);
  });
});

describe("BoardMemberSchema", () => {
  it("exige une initiale d'une seule lettre", () => {
    const member = { firstName: "Jean-Marc", role: "Président" };
    expect(BoardMemberSchema.safeParse({ ...member, lastNameInitial: "R" }).success).toBe(true);
    expect(BoardMemberSchema.safeParse({ ...member, lastNameInitial: "Ro" }).success).toBe(false);
  });
});
