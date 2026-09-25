// T039a — limite de fréquence par IP de POST /api/contact (FR-020)
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestEnv } from "../support/cloudflare-env";

const mocks = vi.hoisted(() => ({ env: undefined as CloudflareEnv | undefined }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: async () => true }));
vi.mock("@/lib/email", () => ({ sendContactNotification: async () => ({ ok: true }) }));

const { POST } = await import("@/app/api/contact/route");
const { CONTACT_RATE_LIMIT, hashIp } = await import("@/lib/rate-limit");

let dispose: () => Promise<void>;

beforeAll(async () => {
  const test = await createTestEnv();
  mocks.env = test.env;
  dispose = test.dispose;
});

afterAll(() => dispose());

const body = JSON.stringify({
  firstName: "Camille",
  lastName: "Durand",
  email: "camille@example.fr",
  subject: "autre",
  message: "Bonjour",
  captchaToken: "token",
  rgpdNoticeAcknowledged: true,
});

const post = (ip: string, payload = body) =>
  POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip },
      body: payload,
    }),
  );

describe("limite de fréquence par IP", () => {
  it(`accepte ${CONTACT_RATE_LIMIT} envois par heure puis répond 429`, async () => {
    for (let i = 0; i < CONTACT_RATE_LIMIT; i++) {
      expect((await post("192.0.2.1")).status).toBe(201);
    }
    const blocked = await post("192.0.2.1");
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({
      errors: { rateLimit: "Trop de demandes envoyées récemment, merci de réessayer plus tard." },
    });
  });

  it("vérifie la limite avant la validation des champs", async () => {
    expect((await post("192.0.2.1", "{}")).status).toBe(429);
  });

  it("n'affecte pas une autre adresse IP", async () => {
    expect((await post("192.0.2.2")).status).toBe(201);
  });

  it("ne stocke jamais l'IP en clair", async () => {
    const { keys } = await mocks.env!.RATE_LIMIT_KV.list();
    expect(keys.map((k) => k.name)).toContain(`contact:${await hashIp("192.0.2.1")}`);
    expect(keys.some((k) => k.name.includes("192.0.2"))).toBe(false);
  });
});
