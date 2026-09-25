// T038a / T053a — politique de confidentialité (FR-014, FR-019)
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, expectResponsiveLayout } from "./helpers";

test("page publique décrivant l'usage et la conservation des données", async ({ page }) => {
  await page.goto("/politique-de-confidentialite");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Politique de confidentialité");
  await expect(page.getByRole("heading", { name: /Finalités/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Durée de conservation/ })).toBeVisible();
  await expect(page.getByText(/supprimées automatiquement 12 mois/)).toBeVisible();
  await expect(page.getByText(/membres du bureau/)).toBeVisible();

  await page.getByRole("link", { name: /Vos droits/ }).click();
  await expect(page).toHaveURL(/#droits$/);
  await expectNoA11yViolations(page);
});

test("mise en page responsive (T053a)", async ({ page }) => {
  await expectResponsiveLayout(page, "/politique-de-confidentialite");
});
