// T043 — liste, PATCH idempotent (processedAt renseigné une seule fois), suppression manuelle
// immédiate (indépendante de purgeAt)
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { admin, contactRequest } from "../../drizzle/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTestEnv } from "../support/cloudflare-env";

const mocks: { env?: CloudflareEnv } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));

const { GET, PATCH, DELETE } = await import("@/app/api/admin/contact-requests/[[...id]]/route");
const { getDb } = await import("@/lib/db");

let dispose: () => Promise<void>;
let sessionCookie: string;

beforeAll(async () => {
  const test = await createTestEnv();
  mocks.env = test.env;
  dispose = test.dispose;

  const db = await getDb();
  const [row] = await db
    .insert(admin)
    .values({ email: "admin@example.fr", passwordHash: await hashPassword("password1234") })
    .returning();
  sessionCookie = `admin_session=${await createSession(db, row.id)}`;
});

afterAll(() => dispose());

beforeEach(async () => {
  await mocks.env!.DB.prepare("DELETE FROM contact_request").run();
});

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function createOne() {
  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .insert(contactRequest)
    .values({
      firstName: "Camille",
      lastName: "Durand",
      email: "camille@example.fr",
      subject: "autre",
      message: "Bonjour",
      submittedAt: now,
      captchaVerified: true,
      rgpdNoticeAcknowledged: true,
      purgeAt: new Date(now.getTime() + 1000),
      notificationSentAt: now,
    })
    .returning();
  return row;
}

describe("GET /api/admin/contact-requests", () => {
  it("liste les demandes les plus récentes en premier", async () => {
    await createOne();
    const response = await GET(req("http://localhost/api/admin/contact-requests", "GET"));
    expect(response.status).toBe(200);
    expect((await response.json()) as unknown[]).toHaveLength(1);
  });
});

describe("PATCH /api/admin/contact-requests/{id}", () => {
  it("renseigne processedAt une seule fois (idempotent)", async () => {
    const created = await createOne();
    const first = await PATCH(
      req(`http://localhost/api/admin/contact-requests/${created.id}`, "PATCH", { processed: true }),
      { params: Promise.resolve({ id: [created.id] }) },
    );
    const firstBody = (await first.json()) as { processedAt: number };
    expect(firstBody.processedAt).not.toBeNull();

    const second = await PATCH(
      req(`http://localhost/api/admin/contact-requests/${created.id}`, "PATCH", { processed: true }),
      { params: Promise.resolve({ id: [created.id] }) },
    );
    const secondBody = (await second.json()) as { processedAt: number };
    expect(secondBody.processedAt).toBe(firstBody.processedAt);
  });
});

describe("DELETE /api/admin/contact-requests/{id}", () => {
  it("supprime immédiatement, indépendamment de purgeAt", async () => {
    const created = await createOne();
    const response = await DELETE(req(`http://localhost/api/admin/contact-requests/${created.id}`, "DELETE"), {
      params: Promise.resolve({ id: [created.id] }),
    });
    expect(response.status).toBe(204);

    const db = await getDb();
    expect(await db.select().from(contactRequest)).toHaveLength(0);
  });
});
