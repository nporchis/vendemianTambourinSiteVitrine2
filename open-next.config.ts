// Configuration de l'adapter OpenNext pour Cloudflare Workers (T001).
// Les pages alimentées par D1 sont rendues dynamiquement (research.md §20) : seul le contenu
// pré-rendu (le tambourin, politique de confidentialité, 404) passe par le cache incrémental,
// servi en lecture seule depuis les assets statiques — aucun bucket R2 à provisionner.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
