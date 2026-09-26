// Accueil (T020, FR-001, FR-024, FR-025) — rendu à chaque requête pour que le prochain
// match et les chiffres clés reflètent la base (research.md §20).
import Image from "next/image";
import { KeyFigures } from "@/components/home/KeyFigures";
import { NextMatch } from "@/components/home/NextMatch";
import { Header } from "@/components/layout/Header";
import { LinkButton } from "@/components/ui/Button";
import { Highlight } from "@/components/ui/PageHero";
import { SectionHead } from "@/components/ui/SectionHead";
import { getClubInfo } from "@/lib/club-info";
import { getDb } from "@/lib/db";
import { getNextCompetition } from "@/lib/next-competition";
import fronton from "../../public/images/fronton.jpg";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const [clubInfo, nextCompetition] = await Promise.all([getClubInfo(db), getNextCompetition(db)]);
  let section = 0;

  return (
    <>
      {/* Hero plein écran : photo du fronton, en-tête en surimpression (§4.3) */}
      <section className="vt-hero relative flex min-h-dvh flex-col overflow-hidden">
        <Image
          src={fronton}
          alt=""
          fill
          preload
          sizes="100vw"
          placeholder="blur"
          className="object-cover object-[center_30%]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-(image:--vt-hero-overlay)" />
        <Header current="/" variant="overlay" />

        <div className="vt-container vt-gutter relative flex flex-1 flex-col justify-end gap-5 pb-10">
          <p className="inline-flex items-center gap-3.5 text-small font-bold tracking-eyebrow text-vt-text-on-dark uppercase">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-pill bg-vt-yellow shadow-[0_0_0_4px_rgb(240_196_25/0.25)]"
            />
            Vendémian Tambourin — Club de tambourin de l&apos;Hérault depuis 1923
          </p>
          <h1 className="text-hero font-extrabold tracking-[0.005em] text-vt-cream">
            La balle <Highlight>vole</Highlight>,
            <br />
            nous suivons.
          </h1>
          <p className="max-w-[560px] text-base leading-[1.55] text-vt-text-on-dark md:text-lg">
            Un club ancré dans la tradition sportive occitane : entraînements, compétitions et
            transmission d&apos;un jeu vivant, depuis le cœur de l&apos;Hérault.
          </p>
          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap">
            <LinkButton href="/le-tambourin">Découvrir le sport</LinkButton>
            <LinkButton href="/calendrier" variant="outline-dark">
              Voir le calendrier
            </LinkButton>
          </div>
        </div>

        {clubInfo && clubInfo.keyFigures.length > 0 && (
          <div className="vt-container vt-gutter relative">
            <KeyFigures figures={clubInfo.keyFigures} />
          </div>
        )}
      </section>

      <main id="contenu" tabIndex={-1} className="flex-1">
        {nextCompetition && (
          <section
            aria-labelledby="prochain-match"
            className="vt-container vt-gutter pt-16 pb-14 lg:pt-[88px] lg:pb-[72px]"
          >
            <SectionHead
              number={++section}
              id="prochain-match"
              title="Prochain match"
              link={{ href: "/calendrier", label: "Tout le calendrier" }}
            />
            <NextMatch competition={nextCompetition} />
          </section>
        )}

        <section
          aria-labelledby="le-club"
          className={`vt-container vt-gutter pb-16 lg:pb-[88px] ${
            nextCompetition ? "" : "pt-16 lg:pt-[88px]"
          }`}
        >
          <SectionHead
            number={++section}
            id="le-club"
            title="Le club"
            link={{ href: "/le-club", label: "Notre histoire" }}
          />
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-5">
              <p className="font-display text-statement font-extrabold uppercase">
                Un jeu de paume avec un tambour, une balle, et beaucoup de cœur.
              </p>
              <p className="text-[1.0625rem] leading-[1.7] text-vt-text-prose">
                Le tambourin se joue à cinq contre cinq sur un terrain de 80 mètres. À Vendémian, on
                le pratique depuis 1923 — entre amis, en famille, en compétition régionale et
                nationale.
              </p>
              <p className="text-[1.0625rem] leading-[1.7] text-vt-text-prose">
                Chaque saison, le club forme ses jeunes, engage ses équipes en championnat et porte
                les couleurs du village partout dans l&apos;Hérault.
              </p>
              <div>
                <LinkButton href="/le-club" variant="outline-light">
                  En savoir plus
                </LinkButton>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-vt-ink">
              <Image
                src={fronton}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-[center_30%]"
              />
            </div>
          </div>
        </section>

        {/* Bande d'appel en diagonale (§4.18) → formulaire, sujet Adhésion / essai */}
        <section
          aria-labelledby="viens-essayer"
          className="vt-on-dark relative overflow-hidden bg-vt-ink"
        >
          <div
            aria-hidden="true"
            className="absolute -top-[40%] -right-[8%] hidden h-[180%] w-[52%] -rotate-[8deg] bg-vt-yellow lg:block"
          />
          <div className="vt-container relative grid lg:vt-gutter lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-10 lg:py-20">
            <h2
              id="viens-essayer"
              className="vt-gutter pt-16 pb-12 text-cta font-extrabold text-vt-cream lg:p-0"
            >
              Viens <span className="text-vt-yellow">essayer</span>
              <br />
              le tambourin.
            </h2>
            {/* Mobile : bloc jaune empilé, bord supérieur en biais ; desktop : sur le bandeau. */}
            <div className="vt-gutter flex flex-col items-start gap-4 bg-vt-yellow pt-14 pb-12 [clip-path:polygon(0_18%,100%_0,100%_100%,0_100%)] lg:items-end lg:bg-transparent lg:p-0 lg:text-right lg:[clip-path:none]">
              <p className="max-w-[320px] text-[1.0625rem] font-semibold text-vt-ink">
                Première séance gratuite. Tous niveaux, dès 8 ans. Rejoins la famille du club.
              </p>
              <LinkButton href="/contact?sujet=adhesion" variant="dark">
                Nous contacter
              </LinkButton>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
