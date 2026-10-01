// T039 — création avec logo (multipart), modification, suppression (supprime aussi le logo R2)
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { admin, partner } from "../../drizzle/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTestEnv } from "../support/cloudflare-env";

const mocks: { env?: CloudflareEnv } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));

const { POST, PATCH, DELETE } = await import("@/app/api/admin/partners/[[...id]]/route");
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
  await mocks.env!.DB.prepare("DELETE FROM partner").run();
});

function makeLogo() {
  return new File([new Uint8Array(1024)], "logo.png", { type: "image/png" });
}

function postForm(form: FormData) {
  return POST(new Request("http://localhost/api/admin/partners", { method: "POST", headers: { Cookie: sessionCookie }, body: form }));
}

describe("POST /api/admin/partners", () => {
  it("201 : crée un partenaire avec logo", async () => {
    const form = new FormData();
    form.set("name", "Boulangerie du Fronton");
    form.set("level", "soutien");
    form.set("logo", makeLogo());

    const response = await postForm(form);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { logoUrl: string };
    expect(body.logoUrl).toMatch(/^\/media\/logos\/.+\.png$/);
  });
});

describe("PATCH/DELETE /api/admin/partners/{id}", () => {
  async function createOne() {
    const form = new FormData();
    form.set("name", "Boulangerie du Fronton");
    form.set("level", "soutien");
    form.set("logo", makeLogo());
    return (await (await postForm(form)).json()) as { id: string; logoUrl: string };
  }

  it("modifie les métadonnées en JSON", async () => {
    const created = await createOne();
    const response = await PATCH(
      new Request(`http://localhost/api/admin/partners/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: sessionCookie },
        body: JSON.stringify({ name: "Nouveau nom" }),
      }),
      { params: Promise.resolve({ id: [created.id] }) },
    );
    expect(response.status).toBe(200);
    expect(((await response.json()) as { name: string }).name).toBe("Nouveau nom");
  });

  it("supprime le partenaire et son logo R2", async () => {
    const created = await createOne();
    const key = created.logoUrl.replace("/media/", "");
    expect(await mocks.env!.MEDIA_BUCKET.get(key)).not.toBeNull();

    const response = await DELETE(
      new Request(`http://localhost/api/admin/partners/${created.id}`, {
        method: "DELETE",
        headers: { Cookie: sessionCookie },
      }),
      { params: Promise.resolve({ id: [created.id] }) },
    );
    expect(response.status).toBe(204);
    expect(await mocks.env!.MEDIA_BUCKET.get(key)).toBeNull();

    const db = await getDb();
    expect(await db.select().from(partner)).toHaveLength(0);
  });
});
