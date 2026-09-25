// T022 / T053a — US2 « Consulter le calendrier » (FR-003, FR-011, FR-016)
import { expect, test } from "@playwright/test";
import { execSql, expectNoA11yViolations, expectResponsiveLayout, resetDb } from "./helpers";

test.beforeEach(() => resetDb());
test.afterAll(() => resetDb());

test("sépare les compétitions à venir des passées, avec résultat", async ({ page }) => {
  await page.goto("/calendrier");
  const upcoming = page.getByRole("region", { name: "À venir" });
  const past = page.getByRole("region", { name: "Derniers résultats" });

  const next = upcoming.getByRole("listitem").first();
  await expect(next.getByRole("heading", { name: "Championnat régional · J12" })).toBeVisible();
  await expect(next).toContainText("Fronton Vendémianais — Vendémian");
  await expect(next.locator("time")).toHaveText(/\d{1,2} \p{L}+/u);
  await expect(upcoming.getByRole("listitem")).toHaveCount(2);
  await expect(upcoming).not.toContainText("Victoire");

  const played = past.getByRole("listitem").first();
  await expect(played.getByRole("heading", { name: /Coupe départementale/ })).toBeVisible();
  await expect(played).toContainText("Victoire 13–7");
  await expect(past.getByRole("listitem")).toHaveCount(2);

  await expectNoA11yViolations(page);
});

test("filtre les compétitions par URL", async ({ page }) => {
  await page.goto("/calendrier");
  await page.getByRole("link", { name: "Passées", exact: true }).click();
  await expect(page).toHaveURL(/filtre=passees/);
  await expect(page.getByRole("link", { name: "Passées", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("region", { name: "À venir" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Derniers résultats" })).toBeVisible();
});

test("affiche un état vide explicite sans compétition (FR-011)", async ({ page }) => {
  execSql("DELETE FROM competition;");
  await page.goto("/calendrier");
  await expect(page.getByRole("heading", { name: "Aucune compétition programmée" })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("mise en page responsive (T053a)", async ({ page }) => {
  await expectResponsiveLayout(page, "/calendrier");
});
