// Contact (T050, FR-006, FR-013, FR-023) : `?sujet=` présélectionne le sujet, carte des
// coordonnées du club lues en base, formulaire protégé par Turnstile.
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { RgpdNotice } from "@/components/contact/RgpdNotice";
import { Header } from "@/components/layout/Header";
import { Highlight, PageHero } from "@/components/ui/PageHero";
import { getClubInfo } from "@/lib/club-info";
import { parseSubjectParam } from "@/lib/contact-subjects";
import { createDb, getEnv } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Adhésion, essai, partenariat, presse : écrivez au Vendémian Tambourin, le club répond à tout le monde.",
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-vt-cream/15 py-4">
      <dt className="text-xs font-extrabold tracking-[0.12em] text-vt-text-on-dark-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[1.0625rem] break-words">{children}</dd>
    </div>
  );
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialSubject = parseSubjectParam((await searchParams).sujet);
  const env = await getEnv();
  const clubInfo = await getClubInfo(createDb(env.DB));

  return (
    <>
      <Header current="/contact" />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <PageHero
          eyebrow="Nous contacter"
          title={
            <>
              Une question&nbsp;?
              <br />
              <Highlight>Écris-nous</Highlight>.
            </>
          }
          lead="Pour l'adhésion, un essai, les partenariats, la presse — ou juste l'envie de passer au fronton : on répond à tout le monde."
        />

        <div className="vt-container vt-gutter grid items-start gap-10 py-12 md:py-16 lg:grid-cols-[1.35fr_1fr] lg:gap-12 lg:pt-[72px] lg:pb-[88px]">
          <ContactForm
            initialSubject={initialSubject}
            turnstileSiteKey={env.TURNSTILE_SITE_KEY}
            rgpdNotice={<RgpdNotice />}
          />

          <aside
            aria-labelledby="coordonnees"
            className="vt-on-dark rounded-card bg-vt-surface-dark p-6 text-vt-cream md:p-9"
          >
            <h2
              id="coordonnees"
              className="mb-4 text-[2rem] font-extrabold text-vt-yellow md:text-[2.5rem]"
            >
              Le club
            </h2>
            <dl>
              <InfoRow label="Lieu">Fronton Vendémianais, Vendémian (Hérault)</InfoRow>
              {clubInfo && (
                <InfoRow label="Email">
                  <a
                    href={`mailto:${clubInfo.contactEmail}`}
                    className="text-vt-cream underline hover:text-vt-yellow"
                  >
                    {clubInfo.contactEmail}
                  </a>
                </InfoRow>
              )}
              {clubInfo?.contactPhone && (
                <InfoRow label="Téléphone">
                  <a
                    href={`tel:${clubInfo.contactPhone.replace(/\s+/g, "")}`}
                    className="text-vt-cream underline hover:text-vt-yellow"
                  >
                    {clubInfo.contactPhone}
                  </a>
                </InfoRow>
              )}
              {clubInfo && clubInfo.socialLinks.length > 0 && (
                <InfoRow label="Réseaux">
                  <ul className="flex flex-wrap gap-4">
                    {clubInfo.socialLinks.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vt-yellow hover:text-vt-yellow-hover"
                        >
                          {link.label}
                          <span className="sr-only"> (nouvel onglet)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </InfoRow>
              )}
            </dl>
          </aside>
        </div>
      </main>
    </>
  );
}
