// `npm run seed:admin -- --email=... --password=...` (T019) — crée le premier compte
// administrateur actif. Prérequis de mise en place, hors périmètre utilisateur de la feature
// (voir quickstart.md) : sans ce compte, personne ne peut se connecter au backoffice.
// Pas de top-level await : `tsx` le transforme en CommonJS (pas de `"type": "module"` dans
// package.json), qui ne le supporte pas.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hashPassword } from "../src/lib/auth/password";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  const remote = process.argv.includes("--remote");

  if (!email || !password) {
    console.error("Usage: npm run seed:admin -- --email=<email> --password=<mot de passe> [--remote]");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Le mot de passe doit contenir au moins 12 caractères.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const sql = `INSERT INTO admin (id, email, password_hash, active) VALUES ('${crypto.randomUUID()}', '${email.replace(/'/g, "''")}', '${passwordHash}', 1);`;

  const file = fileURLToPath(new URL("./.seed-admin.sql", import.meta.url));
  writeFileSync(file, sql);
  try {
    execFileSync(
      "npx",
      ["wrangler", "d1", "execute", "DB", remote ? "--remote" : "--local", "--file", file],
      { stdio: "inherit", shell: process.platform === "win32" },
    );
    console.info(`Compte administrateur créé : ${email}`);
  } finally {
    rmSync(file, { force: true });
  }
}

main();
