// Notification email au club via Resend (T046, FR-017, FR-023, research.md §11).
// Appel bloquant avec un timeout explicite : un échec est remonté au Route Handler, qui
// répond 502 sans confirmation.
import { CONTACT_SUBJECT_LABELS, type ContactSubject } from "./contact-subjects";

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

/** Valeur de EMAIL_PROVIDER_API_KEY qui journalise l'email au lieu de l'envoyer (dev local). */
export const DEV_LOG_API_KEY = "dev-log";

export type ContactNotification = {
  firstName: string;
  lastName: string;
  email: string;
  subject: ContactSubject;
  message: string;
};

export type EmailConfig = {
  apiKey: string | undefined;
  to: string | undefined;
  from: string | undefined;
};

export type EmailResult = { ok: true } | { ok: false; reason: string };

export type OutgoingEmail = { to: string; subject: string; text: string; replyTo?: string };

export function buildNotification(request: ContactNotification) {
  const label = CONTACT_SUBJECT_LABELS[request.subject];
  return {
    subject: `[Site du club] ${label}`,
    text: [
      `Sujet : ${label}`,
      `Prénom : ${request.firstName}`,
      `Nom : ${request.lastName}`,
      `Email : ${request.email}`,
      "",
      "Message :",
      request.message,
    ].join("\n"),
  };
}

/** Envoi générique (T008), réutilisé par la notification de contact et le reset de mot de passe. */
export async function sendEmail(email: OutgoingEmail, config: EmailConfig): Promise<EmailResult> {
  const { to, subject, text, replyTo } = email;

  if (config.apiKey === DEV_LOG_API_KEY) {
    console.info(`[email] (dev-log) à ${to} : ${subject}\n${text}`);
    return { ok: true };
  }
  if (!config.apiKey || !config.from) {
    return { ok: false, reason: "configuration email incomplète" };
  }

  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      return { ok: false, reason: `provider HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendContactNotification(
  request: ContactNotification,
  config: EmailConfig,
): Promise<EmailResult> {
  if (!config.to) return { ok: false, reason: "configuration email incomplète" };
  const { subject, text } = buildNotification(request);
  return sendEmail({ to: config.to, subject, text, replyTo: request.email }, config);
}
