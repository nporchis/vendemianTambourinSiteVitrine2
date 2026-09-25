// POST /api/contact (T047) — contracts/api.md, dans l'ordre :
// limite par IP (429) → validation (400) → Turnstile (403) → enregistrement D1 →
// email bloquant (201 si envoyé, 502 sinon, la demande restant enregistrée — FR-017).
import { eq } from "drizzle-orm";
import { contactRequest } from "../../../../drizzle/schema";
import { jsonError, jsonOk } from "@/lib/api-response";
import { createDb, getEnv } from "@/lib/db";
import { sendContactNotification } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { ContactRequestSchema, fieldErrors } from "@/lib/validation";
import { computePurgeAt } from "@/scheduled/purge-contact-requests";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const env = await getEnv();
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";

  // 1. Limite de fréquence par IP (FR-020), avant tout autre traitement.
  if (await isRateLimited(env.RATE_LIMIT_KV, ip)) {
    return jsonError(
      { rateLimit: "Trop de demandes envoyées récemment, merci de réessayer plus tard." },
      429,
    );
  }

  // 2. Validation des champs (FR-007).
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError({ form: "Requête invalide." }, 400);
  }
  const parsed = ContactRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(fieldErrors(parsed.error), 400);
  const input = parsed.data;

  // 3. Vérification anti-robot côté serveur (FR-012).
  if (!(await verifyTurnstile(input.captchaToken, env.TURNSTILE_SECRET_KEY, ip))) {
    return jsonError({ captchaToken: "Vérification anti-bot échouée" }, 403);
  }

  // 4. Enregistrement, purge prévue 12 mois plus tard (FR-014).
  const db = createDb(env.DB);
  const submittedAt = new Date();
  const [saved] = await db
    .insert(contactRequest)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      subject: input.subject,
      message: input.message,
      submittedAt,
      captchaVerified: true,
      rgpdNoticeAcknowledged: input.rgpdNoticeAcknowledged,
      purgeAt: computePurgeAt(submittedAt),
      notificationSentAt: null,
    })
    .returning({ id: contactRequest.id });

  // 5. Notification du club, attendue avant de répondre (FR-017).
  const sent = await sendContactNotification(input, {
    apiKey: env.EMAIL_PROVIDER_API_KEY,
    to: env.CLUB_NOTIFICATION_EMAIL,
    from: env.EMAIL_FROM,
  });
  if (!sent.ok) {
    console.error(`[contact] notification non envoyée pour ${saved.id} : ${sent.reason}`);
    return jsonError(
      { notification: "Votre demande n'a pas pu être transmise, merci de réessayer." },
      502,
    );
  }

  await db
    .update(contactRequest)
    .set({ notificationSentAt: new Date() })
    .where(eq(contactRequest.id, saved.id));
  return jsonOk({ confirmation: "Votre demande a bien été envoyée." }, 201);
}
