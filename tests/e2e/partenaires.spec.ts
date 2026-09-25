// T037 / T053a — US4 « Partenaires » (FR-005, FR-023)
import { expect, test } from "@playwright/test";
import { execSql, expectNoA11yViolations, expectResponsiveLayout, resetDb } from "./helpers";

test.beforeEach(() => resetDb());
test.afterAll(() => resetDb());

test("regroupe les partenaires par niveau, dans l'ordre", async ({ page }) => {
  await page.goto("/partenaires");
  const levels = page.getByRole("main").getByRole("heading", { level: 2 });
  await expect(levels).toHaveText([
    "Partenaires principaux",
    "Soutiens",
    "Institutionnels",
    /Devenir\s*partenaire/,
  ]);

  const principal = page.getByRole("region", { name: "Partenaires principaux" });
  await expect(principal.getByRole("listitem")).toHaveText([
    /Cave coopérative de Vendémian/,
    /Domaine des Figuiers/,
  ]);

  const site = principal.getByRole("link", { name: /Cave coopérative/ });
  await expect(site).toHaveAttribute("href", "https://example.org/cave");
  await expect(site).toHaveAttribute("target", "_blank");
  await expect(site).toHaveAttribute("rel", "noopener noreferrer");

  // Partenaire sans site : affiché, non cliquable.
  const soutiens = page.getByRole("region", { name: "Soutiens" });
  await expect(soutiens.getByText("Boulangerie du village")).toBeVisible();
  await expect(soutiens.getByRole("link", { name: /Boulangerie/ })).toHaveCount(0);

  await expectNoA11yViolations(page);
});

test("n'affiche pas un niveau sans partenaire", async ({ page }) => {
  execSql("DELETE FROM partner WHERE level = 'soutien';");
  await page.goto("/partenaires");
  await expect(page.getByRole("heading", { name: "Soutiens" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Institutionnels" })).toBeVisible();
});

test("état vide et bloc « Devenir partenaire » sans aucun partenaire", async ({ page }) => {
  execSql("DELETE FROM partner;");
  await page.goto("/partenaires");
  await expect(
    page.getByRole("heading", { name: "Aucun partenaire pour le moment" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Devenir\s*partenaire/ })).toBeVisible();
});

test("« Devenir partenaire » présélectionne le sujet Partenariat (FR-023)", async ({ page }) => {
  await page.goto("/partenaires");
  await page.getByRole("link", { name: "Devenir partenaire" }).click();
  await expect(page).toHaveURL(/\/contact\?sujet=partenariat$/);
  await expect(page.getByLabel("Sujet")).toHaveValue("partenariat");
});

test("mise en page responsive (T053a)", async ({ page }) => {
  await expectResponsiveLayout(page, "/partenaires");
});
