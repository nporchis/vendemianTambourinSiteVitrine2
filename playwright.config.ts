import { defineConfig, devices } from "@playwright/test";

// Par défaut, les tests E2E tournent contre `next dev` (bindings D1/KV locaux via
// initOpenNextCloudflareForDev). Pour valider le build Workers, lancer `npm run preview`
// puis `E2E_BASE_URL=http://localhost:8787 npm run test:e2e`.
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  // Précompile les routes /admin/** avant le premier test (voir global-setup.ts) : inutile et
  // sans objet contre `npm run preview` (build de production, pas de compilation à la volée).
  globalSetup: externalBaseURL ? undefined : "./tests/e2e/global-setup.ts",
  // Les suites modifient la base locale partagée (états vides) : exécution séquentielle.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  // 120s (plutôt que 60s) : les pages `/admin/**` (feature 002) sont nombreuses et lourdes en
  // client components, dont la première compilation à la volée par `next dev` peut dépasser 60s.
  timeout: 120_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: externalBaseURL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
