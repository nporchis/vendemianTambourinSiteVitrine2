// T039 — POST /api/contact contre une D1 de test (FR-007, FR-012, FR-014, FR-017, FR-023)
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestEnv } from "../support/cloudflare-env";

const mocks = vi.hoisted(() => ({
  env: undefined as CloudflareEnv | undefined,
  verifyTurnstile: vi.fn(),
  sendContactNotification: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: mocks.verifyTurnstile }));
vi.mock("@/lib/email", () => ({ sendContactNotification: mocks.sendContactNotification }));

const { POST } = await import("@/app/api/contact/route");

let dispose: () => Promise<void>;
let ipCounter = 0;

beforeAll(async () => {
  const test = await createTestEnv({ TURNSTILE_SECRET_KEY: "secret" });
  mocks.env = test.env;
  dispose = test.dispose;
});

afterAll(() => dispose());

beforeEach(async () => {
  await mocks.env!.DB.prepare("DELETE FROM contact_request").run();
  mocks.verifyTurnstile.mockReset().mockResolvedValue(true);
  mocks.sendContactNotification.mockReset().mockResolvedValue({ ok: true });
});

const valid = {
  firstName: "Camille",
  lastName: "Durand",
  email: "camille@example.fr",
  subject: "partenariat",
  message: "Bonjour, notre entreprise souhaite soutenir le club.",
  captchaToken: "token",
  rgpdNoticeAcknowledged: true,
};

// Une IP différente par requête : la limite de fréquence est testée à part.
function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": `10.0.0.${++ipCounter}` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function rows() {
  const { results } = await mocks.env!.DB.prepare("SELECT * FROM contact_request").all<{
    first_name: string;
    subject: string;
    submitted_at: number;
    purge_at: number;
    captcha_verified: number;
    notification_sent_at: number | null;
  }>();
  return results;
}

describe("POST /api/contact", () => {
  it("201 : enregistre la demande, notifie le club et renvoie la confirmation", async () => {
    const response = await post(valid);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ confirmation: "Votre demande a bien été envoyée." });

    const [row] = await rows();
    expect(row).toMatchObject({
      first_name: "Camille",
      subject: "partenariat",
      captcha_verified: 1,
    });
    expect(row.notification_sent_at).toEqual(expect.any(Number));

    const submitted = new Date(row.submitted_at);
    const expectedPurge = new Date(submitted);
    expectedPurge.setUTCMonth(expectedPurge.getUTCMonth() + 12);
    expect(row.purge_at).toBe(expectedPurge.getTime());

    expect(mocks.sendContactNotification).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "partenariat", email: "camille@example.fr" }),
      expect.anything(),
    );
  });

  it.each([
    ["prénom manquant", { firstName: "" }, "firstName"],
    ["email invalide", { email: "camille@" }, "email"],
    ["sujet hors liste", { subject: "vente" }, "subject"],
    ["message vide", { message: "   " }, "message"],
    ["mention RGPD non acquittée", { rgpdNoticeAcknowledged: false }, "rgpdNoticeAcknowledged"],
  ])("400 si %s, sans enregistrement", async (_, patch, field) => {
    const response = await post({ ...valid, ...patch });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: Record<string, string> };
    expect(Object.keys(body.errors)).toContain(field);
    expect(await rows()).toHaveLength(0);
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
  });

  it("400 si le corps n'est pas du JSON", async () => {
    expect((await post("pas du json")).status).toBe(400);
  });

  it("403 si la vérification Turnstile échoue, sans enregistrement", async () => {
    mocks.verifyTurnstile.mockResolvedValue(false);
    const response = await post(valid);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      errors: { captchaToken: "Vérification anti-bot échouée" },
    });
    expect(await rows()).toHaveLength(0);
  });

  it("502 si l'email échoue : pas de confirmation, demande conservée (FR-017)", async () => {
    mocks.sendContactNotification.mockResolvedValue({ ok: false, reason: "provider HTTP 500" });
    const response = await post(valid);
    expect(response.status).toBe(502);
    const body = (await response.json()) as { errors: Record<string, string> };
    expect(body.errors.notification).toBeDefined();

    const [row] = await rows();
    expect(row.first_name).toBe("Camille");
    expect(row.notification_sent_at).toBeNull();
  });
});
