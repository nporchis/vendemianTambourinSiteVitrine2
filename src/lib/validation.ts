// Schémas Zod partagés (T011, T018, T024, T030, T041, T044) — validation serveur
// systématique (principe I) ; les messages sont affichés tels quels au visiteur.
import { z } from "zod";
import { PARTNER_LEVELS } from "../../drizzle/schema";
import { CONTACT_SUBJECTS } from "./contact-subjects";

// ------------------------------------------------------------------ Helpers réutilisables

/** Format email RFC 5322 simplifié : partie locale, @, domaine avec au moins un point. */
export const EMAIL_PATTERN = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:".]{2,}$/;

export const requiredString = (message = "Ce champ est obligatoire.") =>
  z.string({ error: message }).trim().min(1, message);

export const emailString = (message = "Saisissez une adresse email valide (ex. nom@exemple.fr).") =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(254, message)
    .regex(EMAIL_PATTERN, message);

export const urlString = (message = "Adresse web invalide.") =>
  z.url({ protocol: /^https?$/, error: message });

// ------------------------------------------------------------------ Contenu (lecture)

export const SocialLinkSchema = z.object({ label: requiredString(), url: urlString() });

export const KeyFigureSchema = z.object({
  value: requiredString().max(8, "8 caractères au plus."),
  label: requiredString(),
});

export const ClubInfoSchema = z.object({
  historyText: requiredString(),
  values: requiredString(),
  teamInfo: z.string().nullish(),
  contactEmail: emailString(),
  contactPhone: z.string().nullish(),
  socialLinks: z.array(SocialLinkSchema).default([]),
  keyFigures: z.array(KeyFigureSchema).max(4, "4 chiffres clés au plus.").default([]),
});

export const BoardMemberSchema = z.object({
  firstName: requiredString(),
  lastNameInitial: requiredString().length(1, "Une seule lettre."),
  role: requiredString(),
});

export const CompetitionSchema = z.object({
  name: requiredString(),
  date: z.coerce.date({ error: "Date invalide." }),
  location: requiredString(),
  description: z.string().nullish(),
  result: z.string().nullish(),
});

export const PhotoCategorySchema = z.object({ name: requiredString() });

export const PhotoSchema = z.object({
  imageUrl: requiredString(),
  categoryId: requiredString(),
  caption: z.string().nullish(),
  takenOrEventDate: z.coerce.date().nullish(),
});

export const PartnerSchema = z.object({
  name: requiredString(),
  level: z.enum(PARTNER_LEVELS, { error: "Niveau inconnu." }),
  websiteUrl: urlString().nullish(),
  logoUrl: urlString().nullish(),
  description: z.string().max(120, "120 caractères au plus.").nullish(),
});

// ------------------------------------------------------------------ Formulaire de contact

export const ContactRequestSchema = z.object({
  firstName: requiredString("Indiquez votre prénom.").max(80, "80 caractères au plus."),
  lastName: requiredString("Indiquez votre nom.").max(80, "80 caractères au plus."),
  email: emailString(),
  subject: z.enum(CONTACT_SUBJECTS, { error: "Choisissez un sujet." }),
  message: requiredString("Écrivez votre message.").max(5000, "5 000 caractères au plus."),
  captchaToken: requiredString("Validez la vérification anti-robot."),
  rgpdNoticeAcknowledged: z.literal(true, {
    error: "Merci d'accepter l'utilisation de vos données pour répondre à votre demande.",
  }),
});

export type ContactRequestInput = z.infer<typeof ContactRequestSchema>;

/** Première erreur par champ, au format `{ champ: message }` de contracts/api.md. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}
