// Le tambourin (T021a, FR-022, research.md §18) : présentation du sport, contenu statique
// maintenu avec le code (pré-rendu).
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Highlight, PageHero } from "@/components/ui/PageHero";
import { SectionHead } from "@/components/ui/SectionHead";

export const metadata: Metadata = {
  title: "Le tambourin",
  description:
    "Le tambourin, sport d'équipe traditionnel occitan : règles en bref, terrain, rôles des joueurs et histoire.",
};

const RULES = [
  {
    figure: "5×5",
    title: "Cinq contre cinq",
    text: "Deux équipes de cinq joueurs s'affrontent : fonds, tiers et cordiers selon leur place sur le terrain.",
  },
  {
    figure: "80 m",
    title: "Terrain long",
    text: "Le terrain mesure environ 80 × 20 mètres. Pas de filet : la balle doit franchir la ligne médiane.",
  },
  {
    figure: "13 J",
    title: "Treize jeux",
    text: "Un match se gagne en treize jeux, comptés comme au tennis : 15, 30, 45, jeu.",
  },
  {
    figure: "+60",
    title: "Km/h de balle",
    text: "Frappée au tambourin, la balle dépasse les 60 km/h. Placement et anticipation font la différence.",
  },
];

const ROLES = [
  {
    title: "Les fonds",
    text: "Les deux joueurs à l'arrière. Ils défendent, renvoient les balles longues et relancent le jeu.",
  },
  {
    title: "Le tiers",
    text: "Le pivot de l'équipe : il fait le lien entre fonds et cordiers et couvre les balles intermédiaires.",
  },
  {
    title: "Les cordiers",
    text: "Les deux joueurs de devant, près de la ligne médiane. Ils attaquent et coupent les trajectoires.",
  },
];

const TIMELINE = [
  {
    year: "XIIIᵉ",
    label: "XIIIᵉ siècle",
    title: "Les origines",
    text: "Le jeu de paume se diffuse dans toute l'Europe ; ses variantes méridionales donneront naissance au tambourin.",
  },
  {
    year: "1860",
    title: "Le sport moderne",
    text: "Le tambourin prend sa forme actuelle dans les villages du Languedoc, en Hérault et dans le Gard.",
  },
  {
    year: "1923",
    title: "Naissance du club",
    text: "Des villageois passionnés fondent le Vendémian Tambourin. Les premiers matchs se jouent sur la place du village.",
  },
  {
    year: "Auj.",
    label: "Aujourd'hui",
    title: "Aujourd'hui",
    text: "Le tambourin compte plus de 2 000 licenciés en France, avec un foyer principal dans l'Hérault.",
  },
];

// Positions des joueurs dans une moitié de terrain (% de la moitié), miroir pour l'adversaire.
const PLAYERS = [
  { x: 8, y: 12 },
  { x: 80, y: 12 },
  { x: 44, y: 50 },
  { x: 8, y: 88 },
  { x: 80, y: 88 },
];

function Field() {
  return (
    <figure>
      <div
        role="img"
        aria-label="Schéma du terrain : rectangle de 80 mètres de long sur 20 mètres de large, coupé en deux par la ligne médiane. Chaque équipe occupe une moitié avec cinq joueurs : deux fonds à l'arrière, un tiers au centre de sa moitié et deux cordiers près de la ligne médiane."
        className="relative aspect-[4/1] border-2 border-vt-yellow bg-[repeating-linear-gradient(90deg,transparent_0_calc(10%-1px),rgb(242_237_224/0.06)_calc(10%-1px)_10%)]"
      >
        <span className="absolute inset-y-0 left-1/2 w-0.5 bg-vt-yellow" />
        <span className="absolute inset-y-0 left-1/4 border-l border-dashed border-vt-yellow/40" />
        <span className="absolute inset-y-0 left-3/4 border-l border-dashed border-vt-yellow/40" />
        {PLAYERS.map((p, i) => (
          <span
            key={`a-${i}`}
            className="absolute -mt-1.5 size-3 rounded-pill border-2 border-vt-ink bg-vt-yellow sm:-mt-2.5 sm:size-5"
            style={{ left: `${p.x / 2}%`, top: `${p.y}%` }}
          />
        ))}
        {PLAYERS.map((p, i) => (
          <span
            key={`b-${i}`}
            className="absolute -mt-1.5 size-3 rounded-pill border-2 border-vt-ink bg-vt-cream sm:-mt-2.5 sm:size-5"
            style={{ right: `${p.x / 2}%`, top: `${p.y}%` }}
          />
        ))}
      </div>
      <figcaption className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-small font-bold tracking-[0.1em] text-[#c9c3b3] uppercase">
        <span>
          <span aria-hidden="true">↔ </span>
          <b className="text-vt-yellow">80 m</b> de longueur
        </span>
        <span>
          <span aria-hidden="true">↕ </span>
          <b className="text-vt-yellow">20 m</b> de largeur
        </span>
        <span>
          <b className="text-vt-yellow">5</b> joueurs par équipe
        </span>
      </figcaption>
    </figure>
  );
}

export default function LeTambourinPage() {
  return (
    <>
      <Header current="/le-tambourin" />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <PageHero
          eyebrow="Le sport"
          title={
            <>
              Un jeu occitan,
              <br />
              <Highlight>vivant</Highlight> depuis
              <br />
              700 ans.
            </>
          }
          lead="Le tambourin est un sport d'équipe traditionnel du sud de la France. On frappe une balle avec un petit tambour tendu, sur un terrain long de 80 mètres. C'est rapide, tactique, et profondément ancré dans l'identité languedocienne."
        />

        <section
          aria-labelledby="regles"
          className="vt-container vt-gutter pt-16 pb-14 lg:pt-[88px] lg:pb-[72px]"
        >
          <SectionHead number={1} id="regles" title="Les règles en bref" />
          <ul className="grid border-y-2 border-vt-ink bg-vt-surface min-[480px]:grid-cols-2 lg:grid-cols-4">
            {RULES.map((rule) => (
              <li
                key={rule.title}
                className="border-vt-ink/12 px-6 py-7 not-last:border-b min-[480px]:border-r min-[480px]:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"
              >
                <p
                  aria-hidden="true"
                  data-deco={rule.figure}
                  className="vt-stroke mb-3.5 font-display text-[3.75rem] leading-[0.9] font-extrabold"
                />
                <h3 className="mb-2 text-2xl font-extrabold">{rule.title}</h3>
                <p className="text-ui leading-[1.6] font-normal text-vt-text-prose">{rule.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="terrain" className="vt-on-dark bg-vt-ink">
          <div className="vt-container vt-gutter py-16 lg:py-[72px]">
            <SectionHead number={2} id="terrain" title="Le terrain" onDark />
            <Field />
            <ul className="mt-11 grid gap-9 border-t border-vt-cream/15 pt-8 md:grid-cols-3">
              {ROLES.map((role) => (
                <li key={role.title}>
                  <h3 className="mb-2.5 text-[2.125rem] font-extrabold text-vt-yellow">
                    {role.title}
                  </h3>
                  <p className="text-ui leading-[1.65] font-normal text-vt-text-on-dark">
                    {role.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="histoire"
          className="vt-container vt-gutter pt-16 pb-14 lg:pt-[88px] lg:pb-[72px]"
        >
          <SectionHead number={3} id="histoire" title="Une histoire languedocienne" />
          <ol>
            {TIMELINE.map((step) => (
              <li
                key={step.year}
                className="grid border-t-2 border-vt-ink md:grid-cols-[180px_1fr] md:gap-x-10"
              >
                <p className="pt-[22px] font-display text-5xl leading-[0.9] font-extrabold md:text-[4rem]">
                  {step.label ? (
                    <>
                      <span aria-hidden="true">{step.year}</span>
                      <span className="sr-only">{step.label}</span>
                    </>
                  ) : (
                    step.year
                  )}
                </p>
                <div className="pt-4 pb-9 md:pt-[22px]">
                  <h3 className="mb-2 text-[1.875rem] font-extrabold">{step.title}</h3>
                  <p className="max-w-[640px] leading-[1.65] text-vt-text-prose">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-vt-yellow">
          <figure className="vt-container vt-gutter py-16 lg:py-[88px]">
            <blockquote className="max-w-[1100px] font-display text-[2.75rem] leading-[0.92] font-extrabold uppercase md:text-[4.5rem] lg:text-[5.75rem]">
              <p>« Une balle, un tambour, et 80 mètres de passion. »</p>
            </blockquote>
            <figcaption className="mt-7 text-small font-extrabold tracking-eyebrow uppercase">
              — Devise du club
            </figcaption>
          </figure>
        </section>
      </main>
    </>
  );
}
