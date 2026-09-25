// T056a / T053a — page 404 personnalisée (FR-021)
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, expectResponsiveLayout } from "./helpers";

test("une URL inexistante affiche la 404 du site avec retour à l'accueil", async ({ page }) => {
  const response = await page.goto("/page-qui-n-existe-pas");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Balle hors du fronton");
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }).first(),
  ).toBeAttached();
  await expectNoA11yViolations(page);

  await page.getByRole("link", { name: "Retour à l'accueil" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("mise en page responsive (T053a)", async ({ page }) => {
  await expectResponsiveLayout(page, "/page-qui-n-existe-pas");
});
