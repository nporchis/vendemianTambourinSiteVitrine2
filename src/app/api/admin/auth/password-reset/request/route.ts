// POST /api/admin/auth/password-reset/request (T015, contracts/admin-api.md) — 200 dans tous les
// cas (anti-énumération), soumis à la même limite de fréquence que le login.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { admin, passwordResetToken } from "../../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { createDb, getEnv } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { isLoginRateLimited } from "@/lib/rate-limit";
import { emailString, fieldErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

const RequestSchema = z.object({ email: emailString() });

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const env = await getEnv();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError({ form: "Requête invalide." }, 400);
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);
  const { email } = parsed.data;

  if (await isLoginRateLimited(env.RATE_LIMIT_KV, email)) {
    return jsonError(
      { rateLimit: "Trop de demandes, merci de réessayer dans quelques minutes." },
      429,
    );
  }

  const db = createDb(env.DB);
  const [row] = await db.select().from(admin).where(eq(admin.email, email)).limit(1);
  if (row && row.active) {
    const token = crypto.randomUUID();
    await db.insert(passwordResetToken).values({
      adminId: row.id,
      tokenHash: await sha256Hex(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    const resetUrl = new URL(`/admin/reinitialiser-mot-de-passe?token=${token}`, request.url);
    await sendEmail(
      {
        to: row.email,
        subject: "[Site du club] Réinitialisation de mot de passe",
        text: [
          "Une réinitialisation de mot de passe a été demandée pour ce compte administrateur.",
          "",
          `Lien valable 1 heure : ${resetUrl.toString()}`,
          "",
          "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        ].join("\n"),
      },
      { apiKey: env.EMAIL_PROVIDER_API_KEY, to: row.email, from: env.EMAIL_FROM },
    );
  }

  // Réponse identique que l'email existe ou non (anti-énumération).
  return jsonOk({ ok: true });
}
