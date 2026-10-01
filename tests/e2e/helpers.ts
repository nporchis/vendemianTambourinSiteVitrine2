// Outils partagés des suites E2E : manipulation de la base D1 locale (celle que lit
// `next dev` via initOpenNextCloudflareForDev) et audit d'accessibilité axe-core.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { seedSql } from "../../scripts/seed-data";

/** Exécute du SQL sur la base D1 locale. */
export function execSql(sql: string) {
  const dir = mkdtempSync(join(tmpdir(), "vt-e2e-"));
  const file = join(dir, "query.sql");
  writeFileSync(file, sql);
  try {
    execFileSync("npx", ["wrangler", "d1", "execute", "DB", "--local", "--file", file], {
      stdio: "pipe",
      shell: process.platform === "win32",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Remet le jeu de démonstration (dates relatives à maintenant). */
export function resetDb() {
  execSql(seedSql());
}

/** Aucune violation WCAG 2.x A/AA détectée par axe-core (T054). */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
  expect(summary, "violations axe-core").toEqual([]);
}

export const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablette", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const;

/** Pas de débordement horizontal au viewport courant (FR-010, SC-004). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "débordement horizontal (px)").toBeLessThanOrEqual(0);
}

/**
 * Parcourt les 3 viewports (T053a) : pas de débordement, contenu principal visible et
 * navigation utilisable (liens en ligne en desktop, bouton « Menu » en dessous).
 */
export async function expectResponsiveLayout(page: Page, path: string) {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto(path, { waitUntil: "load" });
    await expect(page.locator("h1").first()).toBeVisible();
    // Laisse le temps aux éléments rendus après chargement (widget Turnstile, images).
    await page.waitForTimeout(1_500);
    await expectNoHorizontalOverflow(page);
    if (viewport.width >= 1024) {
      await expect(
        page.getByRole("navigation", { name: "Navigation principale" }).first(),
      ).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Ouvrir le menu" })).toBeVisible();
    }
  }
}

export const ADMIN_EMAIL = "e2e-admin@example.fr";
export const ADMIN_PASSWORD = "mot-de-passe-e2e-12";

/**
 * Remet à zéro le compteur de limite de connexion (5 tentatives / 15 min, T007) pour un email
 * donné : sans cela, les nombreuses connexions successives des suites E2E backoffice (une par
 * test, sur le même compte seedé) finissent par déclencher le blocage en cours de suite.
 */
export function resetLoginRateLimit(email: string) {
  const key = `login:${createHash("sha256").update(email.trim().toLowerCase()).digest("hex")}`;
  try {
    execFileSync(
      "npx",
      ["wrangler", "kv", "key", "delete", "--binding", "RATE_LIMIT_KV", "--local", key],
      { stdio: "pipe", shell: process.platform === "win32" },
    );
  } catch {
    // clé absente : rien à faire
  }
}

/**
 * Crée (ou recrée) l'unique compte administrateur utilisé par les suites E2E backoffice.
 * Purge toutes les tables admin (pas seulement la ligne `ADMIN_EMAIL`) : un test précédent qui
 * échoue avant d'avoir nettoyé son propre compte créé (ex. un collègue laissé actif) ne doit
 * jamais fausser la garde « dernier compte actif » du test suivant.
 */
export function seedAdmin() {
  execSql(
    "DELETE FROM admin_session; DELETE FROM admin_audit_log; DELETE FROM password_reset_token; DELETE FROM admin;",
  );
  resetLoginRateLimit(ADMIN_EMAIL);
  execFileSync(
    "npx",
    ["tsx", "scripts/seed-admin.ts", `--email=${ADMIN_EMAIL}`, `--password=${ADMIN_PASSWORD}`],
    { stdio: "pipe", shell: process.platform === "win32" },
  );
}

/** Connexion via l'écran `/admin/login`, jusqu'au tableau de bord. */
export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("/admin");
}

/**
 * Remet à zéro le compteur de limite de fréquence du dev local : sans en-tête
 * CF-Connecting-IP, toutes les requêtes partagent l'« IP » `unknown`.
 */
export function resetRateLimit() {
  const key = `contact:${createHash("sha256").update("unknown").digest("hex")}`;
  try {
    execFileSync(
      "npx",
      ["wrangler", "kv", "key", "delete", "--binding", "RATE_LIMIT_KV", "--local", key],
      { stdio: "pipe", shell: process.platform === "win32" },
    );
  } catch {
    // clé absente : rien à faire
  }
}
