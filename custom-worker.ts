// Point d'entrée du Worker : le handler `fetch` généré par OpenNext, complété du handler
// `scheduled` qui exécute la purge RGPD des demandes de contact (T051, FR-014).
// @ts-expect-error `.open-next/worker.js` est généré au build par `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";
import { purgeExpiredContactRequests } from "./src/scheduled/purge-contact-requests";

export default {
  fetch: handler.fetch,

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(purgeExpiredContactRequests(env.DB));
  },
} satisfies ExportedHandler<CloudflareEnv>;
