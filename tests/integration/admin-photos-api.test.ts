// T029 — upload multipart valide, rejet > 10 Mo (413), rejet format non supporté (415, .gif),
// suppression d'une photo supprime aussi l'objet R2.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { admin, photo, photoCategory } from "../../drizzle/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createTestEnv } from "../support/cloudflare-env";

const mocks: { env?: CloudflareEnv } = {};
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: mocks.env, cf: undefined, ctx: {} }),
}));

const { POST, DELETE } = await import("@/app/api/admin/photos/[[...id]]/route");
const { getDb } = await import("@/lib/db");

let dispose: () => Promise<void>;
let sessionCookie: string;
let categoryId: string;

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
  await mocks.env!.DB.prepare("DELETE FROM photo").run();
  await mocks.env!.DB.prepare("DELETE FROM photo_category").run();
  const db = await getDb();
  const [cat] = await db.insert(photoCategory).values({ name: "Matchs" }).returning();
  categoryId = cat.id;
});

function postForm(form: FormData) {
  return POST(new Request("http://localhost/api/admin/photos", { method: "POST", headers: { Cookie: sessionCookie }, body: form }));
}

function makeFile(bytes: number, type = "image/jpeg", name = "photo.jpg") {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("POST /api/admin/photos", () => {
  it("201 : upload multipart valide", async () => {
    const form = new FormData();
    form.set("file", makeFile(1024));
    form.set("categoryId", categoryId);
    form.set("caption", "Une belle photo");

    const response = await postForm(form);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { imageUrl: string };
    expect(body.imageUrl).toMatch(/^\/media\/photos\/.+\.jpg$/);

    const db = await getDb();
    expect(await db.select().from(photo)).toHaveLength(1);
  });

  it("413 : fichier > 10 Mo", async () => {
    const form = new FormData();
    form.set("file", makeFile(11 * 1024 * 1024));
    form.set("categoryId", categoryId);
    expect((await postForm(form)).status).toBe(413);
  });

  it("415 : format non supporté", async () => {
    const form = new FormData();
    form.set("file", makeFile(1024, "image/gif", "photo.gif"));
    form.set("categoryId", categoryId);
    expect((await postForm(form)).status).toBe(415);
  });

  it("401 sans session", async () => {
    const form = new FormData();
    form.set("file", makeFile(1024));
    form.set("categoryId", categoryId);
    const response = await POST(new Request("http://localhost/api/admin/photos", { method: "POST", body: form }));
    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/admin/photos/{id}", () => {
  it("supprime la ligne D1 et l'objet R2", async () => {
    const form = new FormData();
    form.set("file", makeFile(1024));
    form.set("categoryId", categoryId);
    const created = (await (await postForm(form)).json()) as { id: string; imageUrl: string };

    const key = created.imageUrl.replace("/media/", "");
    expect(await mocks.env!.MEDIA_BUCKET.get(key)).not.toBeNull();

    const response = await DELETE(
      new Request("http://localhost/api/admin/photos/" + created.id, {
        method: "DELETE",
        headers: { Cookie: sessionCookie },
      }),
      { params: Promise.resolve({ id: [created.id] }) },
    );
    expect(response.status).toBe(204);
    expect(await mocks.env!.MEDIA_BUCKET.get(key)).toBeNull();
  });
});
