// Partenaires (T043, FR-005, FR-023) — groupés par niveau non vide, rendu à chaque requête
// (research.md §20), bloc « Devenir partenaire » vers le formulaire (sujet Partenariat).
import { Handshake } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { PartnerTiles } from "@/components/partners/PartnerTiles";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight, PageHero } from "@/components/ui/PageHero";
import { SectionHead } from "@/components/ui/SectionHead";
import { getDb } from "@/lib/db";
import { groupPartnersByLevel, listPartners, PARTNER_LEVEL_LABELS } from "@/lib/partners";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partenaires",
  description: "Les partenaires qui soutiennent le Vendémian Tambourin, et comment le devenir.",
};

const ADVANTAGES = [
  "Votre logo sur les maillots et le site",
  "Visibilité au fronton lors des matchs à domicile",
  "Invitations au repas de fin de saison",
];

export default async function PartenairesPage() {
  const groups = groupPartnersByLevel(await listPartners(await getDb()));

  return (
    <>
      <Header current="/partenaires" />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <PageHero
          eyebrow="Ils soutiennent le club"
          title={
            <>
              Merci à nos
              <br />
              <Highlight>partenaires</Highlight>.
            </>
          }
          lead="Sans eux, pas de maillots, pas de déplacements, pas de stages pour les jeunes. Ils font vivre le tambourin à Vendémian."
        />

        {groups.length === 0 ? (
          <div className="vt-container vt-gutter py-16 lg:py-[88px]">
            <EmptyState icon={Handshake} title="Aucun partenaire pour le moment">
              Le club recherche ses premiers partenaires : pourquoi pas vous&nbsp;?
            </EmptyState>
          </div>
        ) : (
          <div className="pt-16 pb-6 lg:pt-[88px] lg:pb-4">
            {groups.map((group, i) => (
              <section
                key={group.level}
                aria-labelledby={`niveau-${group.level}`}
                className="vt-container vt-gutter pb-12 lg:pb-14"
              >
                <SectionHead
                  number={i + 1}
                  id={`niveau-${group.level}`}
                  title={PARTNER_LEVEL_LABELS[group.level]}
                />
                <PartnerTiles level={group.level} partners={group.partners} />
              </section>
            ))}
          </div>
        )}

        <section aria-labelledby="devenir-partenaire" className="vt-on-dark bg-vt-ink">
          <div className="vt-container vt-gutter grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:py-[72px]">
            <div>
              <h2
                id="devenir-partenaire"
                className="text-[3rem] leading-[0.86] font-extrabold text-vt-cream md:text-[4.5rem] lg:text-[6rem]"
              >
                Devenir
                <br />
                <span className="text-vt-yellow">partenaire</span>.
              </h2>
              <p className="mt-5 max-w-[520px] text-[1.0625rem] leading-[1.6] text-vt-text-on-dark">
                Associez votre nom à la saison et au rayonnement du club, avec une formule adaptée à
                la taille de votre structure.
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              <ul className="flex flex-col gap-3.5">
                {ADVANTAGES.map((advantage) => (
                  <li key={advantage} className="flex gap-3 text-vt-text-on-dark">
                    <span aria-hidden="true" className="font-extrabold text-vt-yellow">
                      →
                    </span>
                    {advantage}
                  </li>
                ))}
              </ul>
              <div className="mt-2.5">
                <LinkButton href="/contact?sujet=partenariat">Devenir partenaire</LinkButton>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
