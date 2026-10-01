// T046 — quickstart.md §6 : apparition d'une nouvelle demande, marquage traité, suppression manuelle.
import { expect, test } from "@playwright/test";
import { loginAsAdmin, resetDb, resetRateLimit, seedAdmin } from "./helpers";

test.beforeEach(() => {
  resetDb();
  seedAdmin();
  resetRateLimit();
});

test("réception, traitement et suppression d'une demande de contact", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("Camille");
  await page.getByRole("textbox", { name: "Nom", exact: true }).fill("Durand");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("camille@example.fr");
  await page.getByLabel("Sujet").selectOption("autre");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("Bonjour, ceci est un message de test E2E.");
  await page.getByLabel(/accepte/i).check();
  await expect(page.locator('input[name="cf-turnstile-response"]')).not.toHaveValue("", {
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Envoyer le message" }).click();
  await expect(page.getByText("Message envoyé")).toBeVisible();

  await loginAsAdmin(page);
  await page.goto("/admin/contacts");
  await expect(page.getByText("Camille Durand")).toBeVisible();
  await expect(page.getByText("Non traitée")).toBeVisible();

  await page
    .locator("li", { hasText: "Camille Durand" })
    .getByRole("button", { name: "Marquer traitée" })
    .click();
  await expect(page.locator("li", { hasText: "Camille Durand" })).toContainText("Traitée");

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator("li", { hasText: "Camille Durand" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page.getByText("Camille Durand")).toHaveCount(0);
});
