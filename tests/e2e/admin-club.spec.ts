// T038 — quickstart.md §4 : modification de la présentation, ajout/retrait d'un membre du bureau.
import { expect, test } from "@playwright/test";
import { loginAsAdmin, resetDb, seedAdmin } from "./helpers";

test.beforeEach(() => {
  resetDb();
  seedAdmin();
});

test("modification de la présentation et gestion du bureau", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/club");

  await page.getByLabel("Histoire").fill("Nouvelle histoire E2E du club.");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Informations enregistrées.")).toBeVisible();

  await page.goto("/le-club");
  await expect(page.getByText("Nouvelle histoire E2E du club.")).toBeVisible();

  await page.goto("/admin/club");
  await page.getByLabel("Prénom").fill("Camille");
  await page.getByLabel("Initiale").fill("D");
  await page.getByLabel("Rôle").fill("Trésorière");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("Camille D. — Trésorière")).toBeVisible();

  await page.goto("/le-club");
  await expect(page.getByText("Camille D.")).toBeVisible();

  await page.goto("/admin/club");
  await page
    .locator("li", { hasText: "Camille D." })
    .getByRole("button", { name: "Retirer" })
    .click();
  await expect(page.getByText("Camille D. — Trésorière")).toHaveCount(0);
});
