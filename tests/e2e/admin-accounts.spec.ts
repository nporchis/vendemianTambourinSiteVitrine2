// T028 — scénarios 5-7 de quickstart.md : création d'un second compte, désactivation invalidant
// la session, refus de supprimer le dernier compte actif.
import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, loginAsAdmin, resetDb, seedAdmin } from "./helpers";

test.beforeEach(() => {
  resetDb();
  seedAdmin();
});

test("création d'un second compte et désactivation", async ({ page, browser, baseURL }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/comptes");

  const colleagueEmail = "collegue-e2e@example.fr";
  // Pas `exact: true` : le champ requis porte un « * » (masqué aux lecteurs d'écran) que
  // Playwright inclut malgré tout dans le texte du <label> qu'il compare pour `getByLabel`.
  await page.getByLabel("Email").fill(colleagueEmail);
  await page.getByLabel("Mot de passe (12 caractères minimum)").fill("mot-de-passe-colleague-1");
  await page.getByRole("button", { name: "Créer le compte" }).click();
  // Exact: l'email du collègue apparaît aussi, en sous-chaîne, dans la ligne du journal
  // d'audit (« ... (collegue-e2e@example.fr) »).
  await expect(page.getByText(colleagueEmail, { exact: true })).toBeVisible();

  // Seconde session, dans un contexte (cookies) séparé : `context.newPage()` partagerait le
  // même cookie de session que `page`, si bien que la connexion du collègue écraserait la
  // session de l'administrateur courant pour les DEUX pages.
  const colleagueContext = await browser.newContext({ baseURL });
  const colleaguePage = await colleagueContext.newPage();
  await colleaguePage.goto("/admin/login");
  await colleaguePage.getByLabel("Email").fill(colleagueEmail);
  await colleaguePage.getByLabel("Mot de passe").fill("mot-de-passe-colleague-1");
  await colleaguePage.getByRole("button", { name: "Se connecter" }).click();
  await colleaguePage.waitForURL("/admin");

  // Désactivation depuis la première session. On scope à la section « Comptes » : l'email du
  // collègue apparaît aussi dans une ligne du journal d'audit juste en dessous.
  const accountsSection = page.locator("section", {
    has: page.getByRole("heading", { name: "Comptes" }),
  });
  await accountsSection
    .locator("li", { hasText: colleagueEmail })
    .getByRole("button", { name: "Désactiver" })
    .click();
  await expect(accountsSection.locator("li", { hasText: colleagueEmail })).toContainText(
    "Désactivé",
  );

  // La session du collègue est immédiatement invalidée.
  await colleaguePage.goto("/admin/competitions");
  await colleaguePage.waitForURL("/admin/login");

  await colleagueContext.close();
});

test("refuse de supprimer le dernier compte actif", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/comptes");

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("li", { hasText: ADMIN_EMAIL })
    .getByRole("button", { name: "Supprimer" })
    .click();

  await expect(page.getByText("Impossible de supprimer le dernier compte actif.")).toBeVisible();
  await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
});
