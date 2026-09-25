// Limite de fréquence du formulaire de contact par IP (T046a, FR-020, research.md §10).
// Compteur KV `contact:{sha256(ip)}` sur une fenêtre d'une heure ; l'IP n'est jamais
// stockée en clair.
export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_RATE_WINDOW_SECONDS = 3600;

type Counter = { count: number; resetAt: number };

export async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Comptabilise une soumission et indique si elle dépasse la limite. La fenêtre démarre à la
 * première soumission et expire d'elle-même (TTL KV) : aucune purge à écrire.
 */
export async function isRateLimited(
  kv: KVNamespace,
  ip: string,
  options: { limit?: number; windowSeconds?: number; now?: number } = {},
): Promise<boolean> {
  const limit = options.limit ?? CONTACT_RATE_LIMIT;
  const windowSeconds = options.windowSeconds ?? CONTACT_RATE_WINDOW_SECONDS;
  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
  const key = `contact:${await hashIp(ip)}`;

  const stored = await kv.get<Counter>(key, "json");
  const current =
    stored && stored.resetAt > nowSeconds
      ? stored
      : { count: 0, resetAt: nowSeconds + windowSeconds };

  if (current.count >= limit) return true;

  await kv.put(key, JSON.stringify({ count: current.count + 1, resetAt: current.resetAt }), {
    // KV impose une expiration au moins 60 s dans le futur.
    expiration: Math.max(current.resetAt, nowSeconds + 60),
  });
  return false;
}
