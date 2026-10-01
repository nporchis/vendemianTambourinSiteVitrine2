// Limite de fréquence par clé KV, réutilisée par le formulaire de contact (par IP, T046a,
// FR-020, research.md §10) et par la connexion/réinitialisation de mot de passe (par email,
// T007, spec.md) : ni l'IP ni l'email ne sont jamais stockés en clair.
export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_RATE_WINDOW_SECONDS = 3600;

// 5 tentatives / 15 min (clarification spec.md), partagée par le login et la demande de
// réinitialisation de mot de passe.
export const LOGIN_RATE_LIMIT = 5;
export const LOGIN_RATE_WINDOW_SECONDS = 900;

type Counter = { count: number; resetAt: number };

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const hashIp = sha256Hex;

/**
 * Comptabilise un essai sous `key` et indique s'il dépasse la limite. La fenêtre démarre au
 * premier essai et expire d'elle-même (TTL KV) : aucune purge à écrire.
 */
export async function isRateLimited(
  kv: KVNamespace,
  key: string,
  options: { limit?: number; windowSeconds?: number; now?: number } = {},
): Promise<boolean> {
  const limit = options.limit ?? CONTACT_RATE_LIMIT;
  const windowSeconds = options.windowSeconds ?? CONTACT_RATE_WINDOW_SECONDS;
  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);

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

/** Limite de fréquence du formulaire de contact, par IP. */
export async function isContactRateLimited(
  kv: KVNamespace,
  ip: string,
  options: { now?: number } = {},
): Promise<boolean> {
  return isRateLimited(kv, `contact:${await hashIp(ip)}`, {
    limit: CONTACT_RATE_LIMIT,
    windowSeconds: CONTACT_RATE_WINDOW_SECONDS,
    now: options.now,
  });
}

/** Limite de fréquence de la connexion/réinitialisation de mot de passe, par email. */
export async function isLoginRateLimited(
  kv: KVNamespace,
  email: string,
  options: { now?: number } = {},
): Promise<boolean> {
  return isRateLimited(kv, `login:${await sha256Hex(email.trim().toLowerCase())}`, {
    limit: LOGIN_RATE_LIMIT,
    windowSeconds: LOGIN_RATE_WINDOW_SECONDS,
    now: options.now,
  });
}
