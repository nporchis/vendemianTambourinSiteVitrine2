import { defineConfig, devices } from "@playwright/test";

// Par défaut, les tests E2E tournent contre `next dev` (bindings D1/KV locaux via
// initOpenNextCloudflareForDev). Pour valider le build Workers, lancer `npm run preview`
// puis `E2E_BASE_URL=http://localhost:8787 npm run test:e2e`.
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "tests/e2e",
  // Les suites modifient la base locale partagée (états vides) : exécution séquentielle.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
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
