// T016 / T053a — US1 « Découvrir le club » (FR-001, FR-002, FR-022, FR-024–FR-027)
import { expect, test } from "@playwright/test";
import { NAV_ITEMS } from "../../src/components/layout/nav-items";
import { execSql, expectNoA11yViolations, expectResponsiveLayout, resetDb } from "./helpers";

test.beforeEach(() => resetDb());
test.afterAll(() => resetDb());

test.describe("Accueil", () => {
  test("présente le club, ses chiffres clés et le prochain match", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/La balle vole/i);
    await expect(page.getByText(/Club de tambourin de l.Hérault depuis 1923/)).toBeVisible();
    await expect(page.getByText(/Un club ancré dans la tradition/)).toBeVisible();

    const figures = page.getByRole("definition").filter({ hasText: /^(1923|6|\+80|N1)$/ });
    await expect(figures).toHaveCount(4);

    const nextMatch = page.getByRole("heading", { name: "Prochain match" });
    await expect(nextMatch).toBeVisible();
    await expect(page.getByText("Championnat régional · J12")).toBeVisible();
    await expect(page.getByText("Fronton Vendémianais — Vendémian")).toBeVisible();

    // Le décompte est calculé après montage et décroît.
    const seconds = page
      .getByRole("definition")
      .filter({ hasText: /^\d{2}$/ })
      .last();
    await expect(seconds).toHaveText(/^\d{2}$/);
    const first = await seconds.textContent();
    await expect(seconds).not.toHaveText(first!, { timeout: 3_000 });

    await expect(page.getByRole("link", { name: "Nous contacter" })).toHaveAttribute(
      "href",
      "/contact?sujet=adhesion",
    );
    await expectNoA11yViolations(page);
  });

  test("masque le prochain match sans compétition à venir", async ({ page }) => {
    execSql("DELETE FROM competition WHERE date > unixepoch() * 1000;");
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prochain match" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Le club", exact: true })).toBeVisible();
  });

  test("n'anime pas les secondes si les animations sont réduites", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByText("Minutes", { exact: true })).toBeVisible();
    await expect(page.getByText("Secondes", { exact: true })).toHaveCount(0);
  });
});

test("Le club : histoire, valeurs et bureau", async ({ page }) => {
  await page.goto("/le-club");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Un club de village/i);
  await expect(page.getByRole("heading", { name: "Notre histoire" })).toBeVisible();
  await expect(page.getByText(/Le club est né en 1923/)).toBeVisible();
  for (const value of ["Transmettre", "Représenter", "Rassembler"]) {
    await expect(page.getByRole("heading", { name: value })).toBeVisible();
  }
  const bureau = page.getByRole("region", { name: "Le bureau" });
  await expect(bureau.getByRole("listitem")).toHaveText([
    /Jean-Marc R\.\s*—\s*Président/,
    /Sylvie B\.\s*—\s*Vice-présidente/,
    /Patrick L\.\s*—\s*Trésorier/,
    /Clara M\.\s*—\s*Secrétaire/,
  ]);
  await expectNoA11yViolations(page);
});

test("Le tambourin : règles, terrain, rôles et frise", async ({ page }) => {
  await page.goto("/le-tambourin");
  await expect(page.getByRole("heading", { name: "Les règles en bref" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cinq contre cinq" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Schéma du terrain/ })).toBeVisible();
  for (const role of ["Les fonds", "Le tiers", "Les cordiers"]) {
    await expect(page.getByRole("heading", { name: role })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Naissance du club" })).toBeVisible();
  await expect(page.getByText("1923", { exact: true })).toBeVisible();
  await expect(page.getByRole("blockquote")).toContainText("80 mètres de passion");
  await expectNoA11yViolations(page);
});

test("navigation commune avec la page courante signalée (FR-027)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const { href, label } of NAV_ITEMS) {
    await page.goto(href);
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link")).toHaveText(NAV_ITEMS.map((i) => i.label));
    await expect(nav.locator('[aria-current="page"]')).toHaveText(label);
    await expect(page.getByRole("link", { name: "Vendémian Tambourin — accueil" })).toHaveAttribute(
      "href",
      "/",
    );
    const footer = page.getByRole("contentinfo");
    for (const link of ["Partenaires", "Contact", "Politique de confidentialité"]) {
      await expect(footer.getByRole("link", { name: link })).toBeVisible();
    }
  }
});

test("menu mobile : dialogue modal, Échap ferme et rend le focus", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/le-club");
  const open = page.getByRole("button", { name: "Ouvrir le menu" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Menu principal" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Fermer le menu" })).toBeFocused();
  await expect(dialog.locator('[aria-current="page"]')).toHaveText("Le club");
  await expectNoA11yViolations(page);

  // Le focus reste piégé dans le dialogue.
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();

  await open.click();
  await page.getByRole("dialog").getByRole("link", { name: "Calendrier" }).click();
  await expect(page).toHaveURL(/\/calendrier$/);
});

test("mise en page responsive (T053a)", async ({ page }) => {
  for (const path of ["/", "/le-club", "/le-tambourin"]) {
    await expectResponsiveLayout(page, path);
  }
});
