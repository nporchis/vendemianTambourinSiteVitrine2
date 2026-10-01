// Garde d'accès `/admin/**` (T012, FR-001, SC-002, research.md §4) — remplace `middleware.ts` en
// Next 16. Défense en profondeur : chaque Route Handler `/api/admin/**` revalide indépendamment
// la session via `requireAdmin()` (src/lib/auth/require-admin.ts), au cas où cette couche serait
// contournée.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/require-admin";
import { validateSession } from "@/lib/auth/session";
import { createDb, getEnv } from "@/lib/db";

const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/mot-de-passe-oublie",
  "/admin/reinitialiser-mot-de-passe",
];

export const config = {
  matcher: ["/admin/:path*"],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const env = await getEnv();
  const admin = await validateSession(createDb(env.DB), token);
  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}
