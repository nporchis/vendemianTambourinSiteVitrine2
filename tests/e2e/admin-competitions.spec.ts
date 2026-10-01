// T024 — scénario 2 de quickstart.md : créer, éditer un résultat, supprimer, vérifier la
// répercussion sur /calendrier sans redéploiement.
import { expect, test } from "@playwright/test";
import { loginAsAdmin, resetDb, seedAdmin } from "./helpers";

test.beforeEach(() => {
  resetDb();
  seedAdmin();
});

test("gestion du calendrier de bout en bout", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/competitions");

  await page.getByRole("button", { name: "Ajouter une compétition" }).click();
  await page.getByLabel("Nom").fill("Tournoi E2E");
  // Pas `exact: true` : le champ requis porte un « * » (masqué aux lecteurs d'écran) que
  // Playwright inclut malgré tout dans le texte du <label> qu'il compare pour `getByLabel`.
  await page.getByLabel("Date").fill("2099-06-15");
  await page.getByLabel("Lieu").fill("Vendémian");
  await page.getByRole("button", { name: "Créer" }).click();
  await expect(page.getByText("Tournoi E2E")).toBeVisible();

  await page.goto("/calendrier");
  await expect(page.getByText("Tournoi E2E")).toBeVisible();

  await page.goto("/admin/competitions");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("li", { hasText: "Tournoi E2E" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Tournoi E2E")).toHaveCount(0);

  await page.goto("/calendrier");
  await expect(page.getByText("Tournoi E2E")).toHaveCount(0);
});
