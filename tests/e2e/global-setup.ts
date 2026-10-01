// Précompile les routes `/admin/**` (nombreuses, lourdes en client components) avant que la
// première suite ne consomme son budget de 120s : sur machine lente, la toute première
// compilation à la volée par `next dev` d'une page jamais visitée peut à elle seule dépasser ce
// budget, faisant échouer le test sans rapport avec un bug applicatif.
import { chromium, type FullConfig } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, seedAdmin } from "./helpers";

const ADMIN_ROUTES = [
  "/admin/login",
  "/admin",
  "/admin/comptes",
  "/admin/competitions",
  "/admin/club",
  "/admin/galerie",
  "/admin/partenaires",
  "/admin/contacts",
];

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;

  seedAdmin();

  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`${baseURL}/admin/login`, { waitUntil: "load", timeout: 150_000 });
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(`${baseURL}/admin`, { timeout: 150_000 });

    for (const route of ADMIN_ROUTES) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "load", timeout: 150_000 });
    }
  } finally {
    await browser.close();
  }
}
