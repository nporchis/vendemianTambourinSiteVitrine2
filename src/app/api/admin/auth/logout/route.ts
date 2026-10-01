// POST /api/admin/auth/logout (T014, contracts/admin-api.md) — 200 systématique.
import { expiredSessionCookieHeader, sessionTokenFromRequest } from "@/lib/auth/require-admin";
import { revokeSession } from "@/lib/auth/session";
import { createDb, getEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = sessionTokenFromRequest(request);
  if (token) {
    const env = await getEnv();
    await revokeSession(createDb(env.DB), token);
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": expiredSessionCookieHeader() },
  });
}
