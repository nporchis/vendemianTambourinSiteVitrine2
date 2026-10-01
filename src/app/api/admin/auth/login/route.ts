// POST /api/admin/auth/login (T013, contracts/admin-api.md) — limite de fréquence par email
// avant toute vérification, message d'erreur générique identique pour identifiants invalides et
// compte désactivé (anti-énumération).
import { eq } from "drizzle-orm";
import { admin } from "../../../../../../drizzle/schema";
import { jsonError } from "@/lib/api-response";
import { verifyPassword } from "@/lib/auth/password";
import { sessionCookieHeader } from "@/lib/auth/require-admin";
import { createSession } from "@/lib/auth/session";
import { createDb, getEnv } from "@/lib/db";
import { isLoginRateLimited } from "@/lib/rate-limit";
import { emailString, fieldErrors, requiredString } from "@/lib/validation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({ email: emailString(), password: requiredString() });

const GENERIC_ERROR = { form: "Identifiants incorrects." };

export async function POST(request: Request) {
  const env = await getEnv();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError({ form: "Requête invalide." }, 400);
  }
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);
  const { email, password } = parsed.data;

  if (await isLoginRateLimited(env.RATE_LIMIT_KV, email)) {
    return jsonError(
      { rateLimit: "Trop de tentatives, merci de réessayer dans quelques minutes." },
      429,
    );
  }

  const db = createDb(env.DB);
  const [row] = await db.select().from(admin).where(eq(admin.email, email)).limit(1);
  if (!row || !row.active || !(await verifyPassword(password, row.passwordHash))) {
    return jsonError(GENERIC_ERROR, 401);
  }

  const token = await createSession(db, row.id);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookieHeader(token) },
  });
}
