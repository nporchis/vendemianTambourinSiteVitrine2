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

export async function sendContactNotification(
  request: ContactNotification,
  config: EmailConfig,
): Promise<EmailResult> {
  const { subject, text } = buildNotification(request);

  if (config.apiKey === DEV_LOG_API_KEY) {
    console.info(`[email] (dev-log) ${subject}\n${text}`);
    return { ok: true };
  }
  if (!config.apiKey || !config.to || !config.from) {
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
        to: [config.to],
        reply_to: request.email,
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
