// Email de notification (T046, FR-017, FR-023) et vérification Turnstile (T045, FR-012)
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNotification, DEV_LOG_API_KEY, sendContactNotification } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";

const request = {
  firstName: "Camille",
  lastName: "Durand",
  email: "camille@example.fr",
  subject: "adhesion" as const,
  message: "Je voudrais essayer.",
};
const config = { apiKey: "re_test", to: "club@example.fr", from: "site@example.fr" };

afterEach(() => vi.unstubAllGlobals());

describe("buildNotification", () => {
  it("reprend le libellé du sujet dans l'objet et les champs dans le corps", () => {
    const { subject, text } = buildNotification(request);
    expect(subject).toContain("Adhésion / essai");
    for (const value of ["Camille", "Durand", "camille@example.fr", "Je voudrais essayer."]) {
      expect(text).toContain(value);
    }
  });
});

describe("sendContactNotification", () => {
  it("envoie l'email au club via Resend, réponse au visiteur", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendContactNotification(request, config)).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body)).toMatchObject({
      to: ["club@example.fr"],
      reply_to: "camille@example.fr",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("signale un échec si le provider répond en erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));
    expect(await sendContactNotification(request, config)).toEqual({
      ok: false,
      reason: "provider HTTP 401",
    });
  });

  it("signale un échec réseau ou un timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(await sendContactNotification(request, config)).toMatchObject({ ok: false });
  });

  it("échoue sans configuration", async () => {
    expect(await sendContactNotification(request, { ...config, apiKey: undefined })).toMatchObject({
      ok: false,
    });
  });

  it("journalise sans envoyer en mode dev-log", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "info").mockImplementation(() => {});
    expect(await sendContactNotification(request, { ...config, apiKey: DEV_LOG_API_KEY })).toEqual({
      ok: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("verifyTurnstile", () => {
  it("accepte un jeton validé par siteverify", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true })));
    expect(await verifyTurnstile("token", "secret", "192.0.2.1")).toBe(true);
  });

  it.each([
    ["refus", () => Promise.resolve(Response.json({ success: false }))],
    ["erreur HTTP", () => Promise.resolve(new Response("", { status: 500 }))],
    ["erreur réseau", () => Promise.reject(new Error("offline"))],
  ])("refuse en cas de %s", async (_, impl) => {
    vi.stubGlobal("fetch", vi.fn(impl));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await verifyTurnstile("token", "secret")).toBe(false);
  });

  it("refuse si la clé secrète manque", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await verifyTurnstile("token", undefined)).toBe(false);
  });
});
