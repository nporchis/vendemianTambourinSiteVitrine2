// `npm run seed` (base locale) / `npm run seed:remote` (T015) : remplace le contenu par le
// jeu de démonstration de seed-data.ts. Les demandes de contact ne sont pas touchées.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { seedSql } from "./seed-data";

const remote = process.argv.includes("--remote");
const file = fileURLToPath(new URL("./.seed.sql", import.meta.url));

writeFileSync(file, seedSql());
try {
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "DB", remote ? "--remote" : "--local", "--file", file],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
} finally {
  rmSync(file, { force: true });
}
