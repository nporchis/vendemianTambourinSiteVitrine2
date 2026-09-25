// Bindings Cloudflare de test : D1 et KV Miniflare en mémoire (getPlatformProxy), schéma
// appliqué depuis les migrations Drizzle versionnées.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getPlatformProxy } from "wrangler";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle", "migrations");

export async function createTestEnv(overrides: Partial<CloudflareEnv> = {}) {
  const proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  const env = { ...proxy.env, ...overrides } as CloudflareEnv;

  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const statements = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) await env.DB.prepare(statement).run();
  }

  return { env, dispose: () => proxy.dispose() };
}
