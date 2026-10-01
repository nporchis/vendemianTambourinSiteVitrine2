// T042 — quickstart.md §5 : ajout avec logo, apparition dans la bonne section, retrait.
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { loginAsAdmin, resetDb, seedAdmin } from "./helpers";

const FIXTURES_DIR = join(process.cwd(), "tests", "e2e", "fixtures");

test.beforeEach(() => {
  resetDb();
  seedAdmin();
});

test("ajout d'un partenaire avec logo puis retrait", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/partenaires");

  await page.getByRole("button", { name: "Ajouter un partenaire" }).click();
  await page.getByLabel("Nom").fill("Partenaire E2E");
  await page.getByLabel("Niveau").selectOption("principal");
  await page.setInputFiles("#partner-logo", join(FIXTURES_DIR, "photo.jpg"));
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(page.getByText("Partenaire E2E")).toBeVisible();

  // Un logo a été joint : le nom sert de texte alternatif à l'image, pas de texte visible.
  await page.goto("/partenaires");
  await expect(page.getByAltText("Partenaire E2E")).toBeVisible();

  await page.goto("/admin/partenaires");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("li", { hasText: "Partenaire E2E" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Partenaire E2E")).toHaveCount(0);

  await page.goto("/partenaires");
  await expect(page.getByAltText("Partenaire E2E")).toHaveCount(0);
});
