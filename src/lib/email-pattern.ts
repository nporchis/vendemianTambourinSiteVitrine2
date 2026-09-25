// Motif email partagé par la validation serveur (Zod) et le formulaire client, sans
// embarquer Zod côté navigateur.
/** Format email RFC 5322 simplifié : partie locale, @, domaine avec au moins un point. */
export const EMAIL_PATTERN = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:".]{2,}$/;
