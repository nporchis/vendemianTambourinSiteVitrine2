// T025 — création, désactivation (+ invalidation des sessions), suppression, refus de
// désactiver/supprimer le dernier compte actif (409), journal d'audit (FR-017)
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { admin, adminAuditLog, adminSession } from "../../drizzle/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTestEnv } from "../support/cloudflare-env";

const mocks: { env?: CloudflareEnv } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));

const { GET, POST, PATCH, DELETE } = await import("@/app/api/admin/admins/[[...id]]/route");
const { getDb } = await import("@/lib/db");

let dispose: () => Promise<void>;
let sessionCookie: string;
let actorId: string;

beforeAll(async () => {
  const test = await createTestEnv();
  mocks.env = test.env;
  dispose = test.dispose;
});

afterAll(() => dispose());

beforeEach(async () => {
  await mocks.env!.DB.prepare("DELETE FROM admin_audit_log").run();
  await mocks.env!.DB.prepare("DELETE FROM admin_session").run();
  await mocks.env!.DB.prepare("DELETE FROM admin").run();

  const db = await getDb();
  const [row] = await db
    .insert(admin)
    .values({ email: "actor@example.fr", passwordHash: await hashPassword("password1234") })
    .returning();
  actorId = row.id;
  sessionCookie = `admin_session=${await createSession(db, row.id)}`;
});

function req(method: string, body?: unknown) {
  return new Request("http://localhost/api/admin/admins", {
    method,
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

describe("POST /api/admin/admins", () => {
  it("201 : crée un compte, journalise admin_created", async () => {
    const response = await POST(req("POST", { email: "colleague@example.fr", password: "password1234" }));
    expect(response.status).toBe(201);

    const db = await getDb();
    const logs = await db.select().from(adminAuditLog);
    expect(logs.map((l) => l.action)).toContain("admin_created");
  });

  it("409 : email déjà utilisé", async () => {
    await POST(req("POST", { email: "colleague@example.fr", password: "password1234" }));
    const response = await POST(req("POST", { email: "colleague@example.fr", password: "password1234" }));
    expect(response.status).toBe(409);
  });

  it("400 : mot de passe trop court", async () => {
    const response = await POST(req("POST", { email: "colleague@example.fr", password: "short" }));
    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/admin/admins/{id}", () => {
  async function createColleague() {
    const response = await POST(req("POST", { email: "colleague@example.fr", password: "password1234" }));
    return (await response.json()) as { id: string };
  }

  it("désactive un compte et invalide ses sessions actives", async () => {
    const colleague = await createColleague();
    const db = await getDb();
    await createSession(db, colleague.id);

    const response = await PATCH(req("PATCH", { active: false }), {
      params: Promise.resolve({ id: [colleague.id] }),
    });
    expect(response.status).toBe(200);

    const sessions = await db.select().from(adminSession);
    const remaining = sessions.filter((s) => s.adminId === colleague.id);
    expect(remaining).toHaveLength(0);

    const logs = await db.select().from(adminAuditLog);
    expect(logs.map((l) => l.action)).toContain("admin_deactivated");
  });

  it("409 : refuse de désactiver le dernier compte actif", async () => {
    const response = await PATCH(req("PATCH", { active: false }), {
      params: Promise.resolve({ id: [actorId] }),
    });
    expect(response.status).toBe(409);
  });
});

describe("DELETE /api/admin/admins/{id}", () => {
  it("409 : refuse de supprimer le dernier compte actif", async () => {
    const response = await DELETE(req("DELETE"), { params: Promise.resolve({ id: [actorId] }) });
    expect(response.status).toBe(409);
  });

  it("204 : supprime un autre compte, journalise admin_deleted", async () => {
    const created = await POST(req("POST", { email: "colleague@example.fr", password: "password1234" }));
    const colleague = (await created.json()) as { id: string };

    const response = await DELETE(req("DELETE"), { params: Promise.resolve({ id: [colleague.id] }) });
    expect(response.status).toBe(204);

    const db = await getDb();
    const logs = await db.select().from(adminAuditLog);
    expect(logs.map((l) => l.action)).toContain("admin_deleted");
  });
});

describe("GET /api/admin/admins", () => {
  it("ne renvoie jamais le hash de mot de passe", async () => {
    const response = await GET(req("GET"));
    const body = (await response.json()) as Record<string, unknown>[];
    for (const row of body) {
      expect(row).not.toHaveProperty("passwordHash");
      expect(row).not.toHaveProperty("password_hash");
    }
  });
});
