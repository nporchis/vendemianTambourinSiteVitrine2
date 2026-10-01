// T048 — audit @axe-core/playwright sur l'ensemble des pages /admin/** (login inclus) : pas de
// violation WCAG 2.x A/AA (hygiène par défaut, principe II en portée réduite pour le backoffice).
import { test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, expectNoA11yViolations, resetDb, seedAdmin } from "./helpers";

test.beforeEach(() => {
  resetDb();
  seedAdmin();
});

test("page de connexion", async ({ page }) => {
  await page.goto("/admin/login");
  await expectNoA11yViolations(page);
});

test("mot de passe oublié", async ({ page }) => {
  await page.goto("/admin/mot-de-passe-oublie");
  await expectNoA11yViolations(page);
});

const DASHBOARD_PAGES = [
  "/admin",
  "/admin/comptes",
  "/admin/club",
  "/admin/competitions",
  "/admin/contacts",
  "/admin/galerie",
  "/admin/partenaires",
];

test("pages du tableau de bord", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("/admin");

  for (const path of DASHBOARD_PAGES) {
    await page.goto(path, { waitUntil: "load" });
    await expectNoA11yViolations(page);
  }
});
