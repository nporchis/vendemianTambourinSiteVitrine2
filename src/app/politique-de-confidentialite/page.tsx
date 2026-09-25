// Politique de confidentialité (T047a, FR-014, FR-019, research.md §12) : texte statique,
// pré-rendu. Brouillon issu des maquettes, à faire relire par le bureau du club.
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Eyebrow } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Ce que le Vendémian Tambourin fait des informations envoyées via le site, et comment exercer vos droits.",
};

const contactLink = (
  <Link href="/contact" className="font-semibold underline">
    page Contact
  </Link>
);

const SECTIONS: { id: string; title: string; body: ReactNode; highlight?: boolean }[] = [
  {
    id: "responsable",
    title: "Responsable du traitement",
    body: (
      <p>
        Le site est édité par l&apos;association <strong>Vendémian Tambourin</strong>. Pour toute
        question sur vos données, écrivez au club via le formulaire ou l&apos;adresse indiquée sur
        la {contactLink}.
      </p>
    ),
  },
  {
    id: "donnees",
    title: "Données collectées",
    body: (
      <>
        <p>Le formulaire de contact collecte :</p>
        <ul className="list-disc pl-6">
          <li>
            votre <strong>prénom</strong>, votre <strong>nom</strong>, votre{" "}
            <strong>adresse email</strong>, le <strong>sujet</strong> et votre{" "}
            <strong>message</strong> ;
          </li>
          <li>
            votre <strong>adresse IP</strong>, uniquement sous une forme chiffrée (empreinte
            SHA-256) et pendant une heure, pour limiter les envois abusifs.
          </li>
        </ul>
        <p>
          Le site affiche aussi les <strong>membres du bureau</strong> du club, avec leur accord :
          prénom, initiale du nom et rôle uniquement, sans photo ni coordonnées. Un membre peut
          demander le retrait de ces informations à tout moment en écrivant au club.
        </p>
        <p>Aucun compte n&apos;est nécessaire pour consulter le site.</p>
      </>
    ),
  },
  {
    id: "finalites",
    title: "Finalités",
    body: (
      <p>
        Vos données servent uniquement à répondre à votre demande et à protéger le formulaire contre
        le spam. Elles ne sont jamais revendues ni utilisées à des fins commerciales.
      </p>
    ),
  },
  {
    id: "conservation",
    title: "Durée de conservation",
    highlight: true,
    body: (
      <p>
        Les demandes de contact sont <strong>supprimées automatiquement 12 mois</strong> après leur
        envoi. L&apos;empreinte de l&apos;adresse IP est effacée au bout d&apos;une heure.
      </p>
    ),
  },
  {
    id: "destinataires",
    title: "Destinataires",
    body: (
      <p>
        Seuls les responsables du club reçoivent vos messages. Le site s&apos;appuie sur des
        prestataires techniques qui traitent les données pour notre compte :{" "}
        <strong>Cloudflare</strong> (hébergement, base de données et protection anti-robot
        Turnstile) et notre <strong>service d&apos;envoi d&apos;emails</strong> (Resend).
      </p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        Le site n&apos;utilise ni cookie publicitaire ni outil de mesure d&apos;audience. La
        vérification anti-robot du formulaire peut déposer des éléments techniques strictement
        nécessaires à son fonctionnement.
      </p>
    ),
  },
  {
    id: "droits",
    title: "Vos droits",
    body: (
      <p>
        Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données, ou
        vous opposer à leur traitement, en écrivant au club depuis la {contactLink}. Si vous estimez
        que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la{" "}
        <a
          href="https://www.cnil.fr/fr/plaintes"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          CNIL<span className="sr-only"> (nouvel onglet)</span>
        </a>
        .
      </p>
    ),
  },
];

export default function PolitiqueDeConfidentialitePage() {
  return (
    <>
      <Header current={null} />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <section className="vt-on-dark bg-vt-ink">
          <div className="vt-container vt-gutter pt-12 pb-10 lg:pt-16 lg:pb-14">
            <Eyebrow>Vos données</Eyebrow>
            <h1 className="mt-3.5 text-[2.25rem] leading-none font-extrabold text-vt-cream md:text-[3.25rem]">
              Politique de confidentialité
            </h1>
            <p className="mt-3.5 max-w-[640px] text-[1.0625rem] leading-[1.6] text-vt-text-on-dark">
              Ce que le club fait des informations envoyées via le formulaire de contact, et comment
              exercer vos droits.
            </p>
          </div>
        </section>

        <div className="vt-container vt-gutter flex flex-col gap-10 pt-12 pb-16 lg:flex-row lg:items-start lg:gap-14 lg:pt-14 lg:pb-[72px]">
          <nav
            aria-labelledby="sommaire"
            className="flex shrink-0 flex-col border-l-[3px] border-vt-terracotta pl-4 lg:sticky lg:top-6 lg:w-60"
          >
            <h2
              id="sommaire"
              className="mb-2 font-display text-meta font-extrabold tracking-[0.06em] text-vt-ink uppercase"
            >
              Sommaire
            </h2>
            <ol>
              {SECTIONS.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="inline-block py-1 text-meta font-semibold text-vt-text-secondary hover:text-vt-terracotta"
                  >
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="flex max-w-[720px] flex-col gap-8">
            <p className="text-small font-semibold text-vt-text-muted">
              Dernière mise à jour : <time dateTime="2026-09-25">25 septembre 2026</time>
            </p>
            {SECTIONS.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-titre`}
                className={`flex scroll-mt-6 flex-col gap-3 leading-[1.7] text-vt-text-prose [&_a]:text-vt-terracotta ${
                  section.highlight
                    ? "rounded-card border-l-4 border-vt-yellow bg-vt-surface p-6"
                    : ""
                }`}
              >
                <h2
                  id={`${section.id}-titre`}
                  className="text-[1.75rem] font-extrabold text-vt-ink"
                >
                  {i + 1}. {section.title}
                </h2>
                {section.body}
              </section>
            ))}
            <Link href="/contact" className="self-start font-bold text-vt-terracotta">
              <span aria-hidden="true">← </span>Retour au formulaire de contact
            </Link>
          </article>
        </div>
      </main>
    </>
  );
}
