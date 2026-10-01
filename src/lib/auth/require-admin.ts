// Garde réutilisée par chaque Route Handler `/api/admin/**` (T011, research.md §4 — défense en
// profondeur en plus de `src/proxy.ts`). Lit le cookie directement sur `Request` (plutôt que
// `next/headers`) pour rester invocable directement en test, comme les autres Route Handlers.
import type { Db } from "../db";
import { type AuthenticatedAdmin, validateSession } from "./session";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return undefined;
}

export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function expiredSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function sessionTokenFromRequest(request: Request): string | undefined {
  return parseCookie(request.headers.get("cookie"), SESSION_COOKIE_NAME);
}

/** L'administrateur authentifié pour la requête courante, ou `null` si session absente/invalide. */
export async function requireAdmin(db: Db, request: Request): Promise<AuthenticatedAdmin | null> {
  return validateSession(db, sessionTokenFromRequest(request));
}
