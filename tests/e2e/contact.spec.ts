// T038 / T053a — US4 « Contacter le club » (FR-006, FR-007, FR-012, FR-013, FR-017, FR-019,
// FR-020, FR-023). Le serveur de dev utilise les clés Turnstile de test (toujours valides)
// et EMAIL_PROVIDER_API_KEY=dev-log (email journalisé) — voir .dev.vars.example.
import { expect, test, type Page } from "@playwright/test";
import { execSql, expectNoA11yViolations, expectResponsiveLayout, resetRateLimit } from "./helpers";

test.beforeAll(() => resetRateLimit());
test.beforeEach(() => execSql("DELETE FROM contact_request;"));

async function fill(page: Page, overrides: Partial<Record<string, string>> = {}) {
  const values = {
    Prénom: "Camille",
    Nom: "Durand",
    Email: "camille@example.fr",
    Message: "Bonjour, je voudrais essayer le tambourin.",
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    await page.getByRole("textbox", { name: label, exact: true }).fill(value!);
  }
}

async function waitForTurnstile(page: Page) {
  // Le widget de test se valide seul ; il dépose son jeton dans un champ caché.
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", {
    timeout: 20_000,
  });
}

test("présélection du sujet par l'URL (FR-023)", async ({ page }) => {
  for (const [slug, expected] of [
    ["adhesion", "adhesion"],
    ["galerie", "galerie"],
    ["partenariat", "partenariat"],
    ["inconnu", ""],
  ]) {
    await page.goto(`/contact?sujet=${slug}`);
    await expect(page.getByLabel("Sujet")).toHaveValue(expected);
  }
  await page.goto("/contact");
  await expect(page.getByLabel("Sujet")).toHaveValue("");
});

test("mention RGPD visible avant l'envoi, liée à la politique (FR-013, FR-019)", async ({
  page,
}) => {
  await page.goto("/contact");
  await expect(page.getByText(/Elles sont conservées 12 mois/)).toBeVisible();
  await page.getByRole("link", { name: "Politique de confidentialité" }).first().click();
  await expect(page).toHaveURL(/\/politique-de-confidentialite$/);
});

test("erreurs explicites sans perte des champs saisis (FR-007)", async ({ page }) => {
  await page.goto("/contact?sujet=presse");
  await fill(page, { Email: "camille@", Nom: "" });
  await page.getByRole("button", { name: "Envoyer le message" }).click();

  const email = page.getByRole("textbox", { name: "Email", exact: true });
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Saisissez une adresse email valide")).toBeVisible();
  await expect(page.getByText("Indiquez votre nom.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Prénom", exact: true })).toHaveValue("Camille");
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue(
    /essayer le tambourin/,
  );
  await expect(page.getByLabel("Sujet")).toHaveValue("presse");
  await expect(page.getByRole("textbox", { name: "Nom", exact: true })).toBeFocused();
  await expectNoA11yViolations(page);
});

test("envoi valide avec Turnstile → confirmation (FR-006, FR-012)", async ({ page }) => {
  await page.goto("/contact");
  await fill(page);
  await page.getByLabel("Sujet").selectOption("adhesion");
  await page.getByRole("checkbox").check();
  await waitForTurnstile(page);
  await page.getByRole("button", { name: "Envoyer le message" }).click();

  await expect(
    page.getByRole("status").getByRole("heading", { name: "Message envoyé" }),
  ).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("textbox", { name: "Prénom", exact: true })).toHaveValue("");
  await expectNoA11yViolations(page);
});

test("affiche l'erreur de limite de fréquence en conservant la saisie (FR-020)", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 429,
      json: {
        errors: { rateLimit: "Trop de demandes envoyées récemment, merci de réessayer plus tard." },
      },
    }),
  );
  await page.goto("/contact?sujet=autre");
  await fill(page);
  await page.getByRole("checkbox").check();
  await waitForTurnstile(page);
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(
    page.getByRole("alert").getByRole("heading", { name: "Trop de messages envoyés" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Prénom", exact: true })).toHaveValue("Camille");
});

test("affiche l'échec d'envoi de l'email sans confirmation (FR-017)", async ({ page }) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 502,
      json: {
        errors: { notification: "Votre demande n'a pas pu être transmise, merci de réessayer." },
      },
    }),
  );
  await page.goto("/contact?sujet=autre");
  await fill(page);
  await page.getByRole("checkbox").check();
  await waitForTurnstile(page);
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(
    page.getByRole("alert").getByRole("heading", { name: "Envoi impossible" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Message envoyé" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue(
    /essayer le tambourin/,
  );
});

test("mise en page responsive (T053a)", async ({ page }) => {
  await expectResponsiveLayout(page, "/contact");
});
