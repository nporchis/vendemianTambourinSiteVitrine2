// Mention d'information RGPD du formulaire de contact (T048, FR-013, FR-019) : usage des
// données, conservation 12 mois, lien vers la politique de confidentialité.
import Link from "next/link";

export function RgpdNotice() {
  return (
    <>
      J&apos;accepte que mes données soient utilisées pour répondre à ma demande. Elles sont
      conservées 12 mois, puis supprimées automatiquement.{" "}
      <Link href="/politique-de-confidentialite" className="font-semibold underline">
        Politique de confidentialité
      </Link>
    </>
  );
}
