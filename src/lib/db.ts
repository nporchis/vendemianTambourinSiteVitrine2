// Client Drizzle adossé au binding D1 `DB` (T010).
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../drizzle/schema";

export type Db = ReturnType<typeof createDb>;

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

/** Bindings et variables Cloudflare de la requête courante (D1, KV, secrets). */
export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}

export async function getDb(): Promise<Db> {
  return createDb((await getEnv()).DB);
}
