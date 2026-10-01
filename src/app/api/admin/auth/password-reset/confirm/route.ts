// POST /api/admin/auth/password-reset/confirm (T015, contracts/admin-api.md) — jeton à usage
// unique (1h), mot de passe ≥ 12 caractères (clarification spec.md), invalide toutes les sessions.
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { admin, passwordResetToken } from "../../../../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForAdmin } from "@/lib/auth/session";
import { createDb, getEnv } from "@/lib/db";
import { fieldErrors, passwordString, requiredString } from "@/lib/validation";

export const dynamic = "force-dynamic";

const ConfirmSchema = z.object({
  token: requiredString("Jeton manquant."),
  password: passwordString(),
});

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
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);
  const { token, password } = parsed.data;

  const db = createDb(env.DB);
  const tokenHash = await sha256Hex(token);
  const [row] = await db
    .select()
    .from(passwordResetToken)
    .where(and(eq(passwordResetToken.tokenHash, tokenHash), isNull(passwordResetToken.usedAt)))
    .limit(1);

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    return jsonError({ token: "Ce lien de réinitialisation est invalide ou a expiré." }, 400);
  }

  await db
    .update(admin)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(admin.id, row.adminId));
  await db
    .update(passwordResetToken)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetToken.id, row.id));
  await revokeAllSessionsForAdmin(db, row.adminId);

  return jsonOk({ ok: true });
}
