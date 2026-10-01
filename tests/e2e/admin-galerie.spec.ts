// T033 — scénario 3 de quickstart.md : upload avec nouvelle catégorie, rejet fichier trop
// lourd/mauvais format, suppression.
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { loginAsAdmin, resetDb, seedAdmin } from "./helpers";

const FIXTURES_DIR = join(process.cwd(), "tests", "e2e", "fixtures");

test.beforeEach(() => {
  resetDb();
  seedAdmin();
});

test("téléversement avec nouvelle catégorie puis suppression", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/galerie");

  await page.setInputFiles("#photo-file", join(FIXTURES_DIR, "photo.jpg"));
  await page.getByLabel("Ou nouvelle catégorie").fill("Tournoi E2E");
  await page.getByLabel("Légende").fill("Photo de test");
  await page.getByRole("button", { name: "Téléverser" }).click();
  // Locator scopé au <p> de la tuile : "Tournoi E2E" apparaît aussi comme <option> du select
  // « Catégorie existante » une fois la catégorie créée (strict mode violation sinon).
  await expect(page.locator("p", { hasText: "Tournoi E2E" })).toBeVisible();

  await page.goto("/galerie");
  await page.getByRole("button", { name: "Tournoi E2E" }).click();
  await expect(page.getByAltText("Photo de test")).toBeVisible();

  // Le jeu de démonstration (resetDb) contient déjà 14 photos : la galerie ne redevient pas vide
  // après cette seule suppression, on vise donc la tuile de la photo téléversée par son légende.
  await page.goto("/admin/galerie");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("li", { hasText: "Photo de test" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Photo de test")).toHaveCount(0);
});

test("rejette un fichier trop lourd ou d'un mauvais format", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/galerie");

  await page.setInputFiles("#photo-file", join(FIXTURES_DIR, "not-an-image.gif"));
  await page.getByRole("button", { name: "Téléverser" }).click();
  await expect(page.getByText(/Format non supporté|Fichier requis/)).toBeVisible();
});
