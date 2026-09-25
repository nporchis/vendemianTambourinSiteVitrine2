// Vérification serveur du jeton Cloudflare Turnstile (T045, FR-012).
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string,
  secret: string | undefined,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY manquant");
    return false;
  }
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const outcome = (await response.json()) as { success?: boolean };
    return outcome.success === true;
  } catch (error) {
    console.error("[turnstile] vérification impossible", error);
    return false;
  }
}
