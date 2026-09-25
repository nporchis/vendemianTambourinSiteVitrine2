// Liste fermée des sujets du formulaire de contact (T043a, FR-023, research.md §17) :
// source unique pour le schéma Zod, le <select> et l'objet de l'email.
// Sans dépendance serveur : importable par le formulaire client.
export const CONTACT_SUBJECTS = ["adhesion", "partenariat", "galerie", "presse", "autre"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  adhesion: "Adhésion / essai",
  partenariat: "Partenariat",
  galerie: "Galerie / photos",
  presse: "Presse",
  autre: "Autre",
};

export function isContactSubject(value: unknown): value is ContactSubject {
  return typeof value === "string" && (CONTACT_SUBJECTS as readonly string[]).includes(value);
}

/** Slug du paramètre `?sujet=` → sujet présélectionné, `null` si absent ou inconnu. */
export function parseSubjectParam(
  slug: string | string[] | undefined | null,
): ContactSubject | null {
  const value = Array.isArray(slug) ? slug[0] : slug;
  return isContactSubject(value) ? value : null;
}
