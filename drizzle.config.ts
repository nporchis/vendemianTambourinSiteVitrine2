// Drizzle Kit (T003) : génère les migrations SQL dans `drizzle/migrations`, appliquées à la
// base D1 (binding `DB`) par `wrangler d1 migrations apply` (scripts `db:migrate:*`).
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
});
