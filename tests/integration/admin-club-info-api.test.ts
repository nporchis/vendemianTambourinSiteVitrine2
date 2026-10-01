// T034 — PATCH /api/admin/club-info (singleton, ClubInfoSchema, max 4 keyFigures), CRUD board-members
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { admin, boardMember, clubInfo } from "../../drizzle/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTestEnv } from "../support/cloudflare-env";

const mocks: { env?: CloudflareEnv } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));

const { PATCH: patchClubInfo } = await import("@/app/api/admin/club-info/route");
const { POST: postMember, PATCH: patchMember, DELETE: deleteMember } = await import(
  "@/app/api/admin/board-members/[[...id]]/route"
);
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
  await mocks.env!.DB.prepare("DELETE FROM club_info").run();
  await mocks.env!.DB.prepare("DELETE FROM board_member").run();
});

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const validClubInfo = {
  historyText: "Fondé en 1923.",
  values: "Convivialité : le partage avant tout.",
  teamInfo: null,
  contactEmail: "club@example.fr",
  contactPhone: null,
  socialLinks: [],
  keyFigures: [{ value: "100", label: "adhérents" }],
};

describe("PATCH /api/admin/club-info", () => {
  it("crée le singleton s'il n'existe pas encore", async () => {
    const response = await patchClubInfo(req("http://localhost/api/admin/club-info", "PATCH", validClubInfo));
    expect(response.status).toBe(200);

    const db = await getDb();
    expect(await db.select().from(clubInfo)).toHaveLength(1);
  });

  it("400 : plus de 4 chiffres clés", async () => {
    const response = await patchClubInfo(
      req("http://localhost/api/admin/club-info", "PATCH", {
        ...validClubInfo,
        keyFigures: [
          { value: "1", label: "a" },
          { value: "2", label: "b" },
          { value: "3", label: "c" },
          { value: "4", label: "d" },
          { value: "5", label: "e" },
        ],
      }),
    );
    expect(response.status).toBe(400);
  });

  it("401 sans session", async () => {
    const response = await patchClubInfo(
      new Request("http://localhost/api/admin/club-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validClubInfo),
      }),
    );
    expect(response.status).toBe(401);
  });
});

describe("CRUD /api/admin/board-members", () => {
  it("crée un membre en fin de liste, le modifie, le supprime", async () => {
    const created = await postMember(
      req("http://localhost/api/admin/board-members", "POST", {
        firstName: "Jean-Marc",
        lastNameInitial: "R",
        role: "Président",
      }),
    );
    expect(created.status).toBe(201);
    const member = (await created.json()) as { id: string; sortOrder: number };
    expect(member.sortOrder).toBe(0);

    const updated = await patchMember(
      req(`http://localhost/api/admin/board-members/${member.id}`, "PATCH", { role: "Vice-président" }),
      { params: Promise.resolve({ id: [member.id] }) },
    );
    expect(updated.status).toBe(200);
    expect(((await updated.json()) as { role: string }).role).toBe("Vice-président");

    const deleted = await deleteMember(req(`http://localhost/api/admin/board-members/${member.id}`, "DELETE"), {
      params: Promise.resolve({ id: [member.id] }),
    });
    expect(deleted.status).toBe(204);

    const db = await getDb();
    expect(await db.select().from(boardMember)).toHaveLength(0);
  });
});
