// T040 — purge des demandes de contact arrivées à échéance (FR-014)
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { computePurgeAt, purgeExpiredContactRequests } from "@/scheduled/purge-contact-requests";
import { createTestEnv } from "../support/cloudflare-env";

let env: CloudflareEnv;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ env, dispose } = await createTestEnv());
});

afterAll(() => dispose());

const now = new Date("2026-10-01T12:00:00.000Z");

async function insert(id: string, purgeAt: Date) {
  await env.DB.prepare(
    `INSERT INTO contact_request (id, first_name, last_name, email, subject, message,
      submitted_at, captcha_verified, rgpd_notice_acknowledged, purge_at)
     VALUES (?, 'A', 'B', 'a@b.fr', 'autre', 'm', ?, 1, 1, ?)`,
  )
    .bind(id, purgeAt.getTime() - 365 * 86_400_000, purgeAt.getTime())
    .run();
}

describe("computePurgeAt", () => {
  it("ajoute 12 mois à la date d'envoi", () => {
    expect(computePurgeAt(new Date("2026-03-15T10:30:00.000Z")).toISOString()).toBe(
      "2027-03-15T10:30:00.000Z",
    );
  });
});

describe("purgeExpiredContactRequests", () => {
  it("supprime uniquement les demandes dont purge_at <= maintenant", async () => {
    await insert("expiree", new Date("2026-09-30T12:00:00.000Z"));
    await insert("echeance-exacte", now);
    await insert("a-conserver", new Date("2026-10-01T12:00:00.001Z"));

    expect(await purgeExpiredContactRequests(env.DB, now)).toBe(2);

    const { results } = await env.DB.prepare("SELECT id FROM contact_request").all<{
      id: string;
    }>();
    expect(results.map((r) => r.id)).toEqual(["a-conserver"]);
  });
});
