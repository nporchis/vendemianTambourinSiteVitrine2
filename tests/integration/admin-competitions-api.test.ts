// T021 — POST/PATCH/DELETE /api/admin/competitions (session requise, validation CompetitionSchema)
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { admin, competition } from "../../drizzle/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTestEnv } from "../support/cloudflare-env";

const mocks: { env?: CloudflareEnv } = {};

import { vi } from "vitest";
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));

const { POST, PATCH, DELETE } = await import("@/app/api/admin/competitions/[[...id]]/route");
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
  const token = await createSession(db, row.id);
  sessionCookie = `admin_session=${token}`;
});

afterAll(() => dispose());

beforeEach(async () => {
  await mocks.env!.DB.prepare("DELETE FROM competition").run();
});

function req(method: string, body?: unknown, opts: { auth?: boolean } = { auth: true }) {
  return new Request("http://localhost/api/admin/competitions", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.auth !== false ? { Cookie: sessionCookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const valid = {
  name: "Finale régionale",
  date: "2027-06-01T13:00:00.000Z",
  location: "Vendémian",
  description: null,
  result: null,
};

describe("POST /api/admin/competitions", () => {
  it("401 sans session", async () => {
    const response = await POST(req("POST", valid, { auth: false }));
    expect(response.status).toBe(401);
  });

  it("400 si un champ requis manque", async () => {
    const response = await POST(req("POST", { ...valid, name: "" }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors: Record<string, string> };
    expect(body.errors.name).toBeDefined();
  });

  it("201 : crée la compétition", async () => {
    const response = await POST(req("POST", valid));
    expect(response.status).toBe(201);
    const body = (await response.json()) as { id: string; name: string };
    expect(body.name).toBe("Finale régionale");

    const db = await getDb();
    const rows = await db.select().from(competition);
    expect(rows).toHaveLength(1);
  });
});

describe("PATCH/DELETE /api/admin/competitions/{id}", () => {
  async function createOne() {
    const db = await getDb();
    const [row] = await db
      .insert(competition)
      .values({ ...valid, date: new Date(valid.date) })
      .returning();
    return row;
  }

  it("200 : modifie une compétition existante", async () => {
    const created = await createOne();
    const response = await PATCH(req("PATCH", { name: "Nom modifié" }), {
      params: Promise.resolve({ id: [created.id] }),
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { name: string };
    expect(body.name).toBe("Nom modifié");
  });

  it("401 sans session sur PATCH/DELETE", async () => {
    const created = await createOne();
    expect(
      (
        await PATCH(req("PATCH", { name: "x" }, { auth: false }), {
          params: Promise.resolve({ id: [created.id] }),
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await DELETE(req("DELETE", undefined, { auth: false }), {
          params: Promise.resolve({ id: [created.id] }),
        })
      ).status,
    ).toBe(401);
  });

  it("204 : supprime une compétition existante", async () => {
    const created = await createOne();
    const response = await DELETE(req("DELETE"), { params: Promise.resolve({ id: [created.id] }) });
    expect(response.status).toBe(204);

    const db = await getDb();
    expect(await db.select().from(competition)).toHaveLength(0);
  });
});
