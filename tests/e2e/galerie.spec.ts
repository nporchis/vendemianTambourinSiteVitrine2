// T029 / T053a — US3 « Parcourir la galerie » (FR-004, FR-011, FR-015, FR-018)
import { expect, test } from "@playwright/test";
import { execSql, expectNoA11yViolations, expectResponsiveLayout, resetDb } from "./helpers";

test.beforeEach(() => resetDb());
test.afterAll(() => resetDb());

const photos = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Photos" }).getByRole("figure");

test("affiche une première page de 12 photos en lazy-loading", async ({ page }) => {
  await page.goto("/galerie");
  await expect(photos(page)).toHaveCount(12);
  const first = photos(page).first().getByRole("img");
  await expect(first).toHaveAttribute("alt", "Match contre Gignac");
  await expect(photos(page).nth(11).getByRole("img")).toHaveAttribute("loading", "lazy");
  await expectNoA11yViolations(page);
});

test("charge la page suivante au défilement, sans clic, puis s'arrête", async ({ page }) => {
  const photoRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/photos")) photoRequests.push(request.url());
  });

  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto("/galerie");
  await expect(photos(page)).toHaveCount(12);
  expect(photoRequests).toHaveLength(0);

  await page.getByTestId("gallery-sentinel").scrollIntoViewIfNeeded();
  await expect(photos(page)).toHaveCount(14);
  expect(photoRequests).toHaveLength(1);
  expect(photoRequests[0]).toContain("cursor=");

  // Dernière page atteinte (nextCursor: null) : plus aucun appel.
  await page.mouse.wheel(0, 5000);
  await page.waitForTimeout(1000);
  expect(photoRequests).toHaveLength(1);
});

test("filtre les photos par catégorie (FR-015)", async ({ page }) => {
  await page.goto("/galerie");
  const filter = page.getByRole("group", { name: "Filtrer les photos par catégorie" });
  await filter.getByRole("button", { name: "Vie du club" }).click();
  await expect(filter.getByRole("button", { name: "Vie du club" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(photos(page)).toHaveCount(7);
  for (const caption of await photos(page).locator("figcaption").allTextContents()) {
    expect(caption).toContain("Vie du club");
  }

  await filter.getByRole("button", { name: "Tout" }).click();
  await expect(photos(page)).toHaveCount(12);
});

test("affiche un état vide explicite sans photo (FR-011)", async ({ page }) => {
  execSql("DELETE FROM photo;");
  await page.goto("/galerie");
  await expect(page.getByRole("heading", { name: "Pas encore de photos" })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("« Envoyer mes photos » présélectionne le sujet Galerie", async ({ page }) => {
  await page.goto("/galerie");
  await expect(page.getByRole("link", { name: "Envoyer mes photos" })).toHaveAttribute(
    "href",
    "/contact?sujet=galerie",
  );
});

test("mise en page responsive (T053a)", async ({ page }) => {
  await expectResponsiveLayout(page, "/galerie");
});
