// Le club (T021, FR-002, FR-026) : histoire, valeurs et bureau, lus en base à chaque
// requête (research.md §20).
import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { LinkButton } from "@/components/ui/Button";
import { Highlight, PageHero } from "@/components/ui/PageHero";
import { SectionHead } from "@/components/ui/SectionHead";
import { boardMemberName, getClubInfo, paragraphs, parseValues } from "@/lib/club-info";
import { getDb } from "@/lib/db";
import fronton from "../../../public/images/fronton.jpg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le club",
  description: "Histoire, valeurs et bureau du Vendémian Tambourin, club de village depuis 1923.",
};

export default async function LeClubPage() {
  const clubInfo = await getClubInfo(await getDb());
  const [statement, ...history] = clubInfo ? paragraphs(clubInfo.historyText) : [];
  const values = clubInfo ? parseValues(clubInfo.values) : [];

  return (
    <>
      <Header current="/le-club" />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <PageHero
          eyebrow="Le club"
          title={
            <>
              Un club de village,
              <br />
              <Highlight>depuis 1923</Highlight>.
            </>
          }
          lead="Né de la passion de quelques villageois, le Vendémian Tambourin fait vivre le fronton du village depuis un siècle, de génération en génération."
        />

        {!clubInfo ? (
          <p className="vt-container vt-gutter py-16 text-lg text-vt-text-prose">
            La présentation du club sera bientôt disponible.
          </p>
        ) : (
          <>
            <section
              aria-labelledby="histoire"
              className="vt-container vt-gutter pt-16 pb-14 lg:pt-[88px] lg:pb-[72px]"
            >
              <SectionHead number={1} id="histoire" title="Notre histoire" />
              <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
                <div className="flex flex-col gap-5">
                  {statement && (
                    <p className="font-display text-[1.75rem] leading-[1.02] font-extrabold uppercase md:text-[2.375rem]">
                      {statement}
                    </p>
                  )}
                  {history.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[1.0625rem] leading-[1.7] text-vt-text-prose"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="relative min-h-[260px] overflow-hidden rounded-card bg-vt-ink md:min-h-[360px]">
                  <Image
                    src={fronton}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover object-[center_30%]"
                  />
                </div>
              </div>
            </section>

            <section
              aria-labelledby="valeurs"
              className="vt-container vt-gutter pb-14 lg:pb-[72px]"
            >
              <SectionHead number={2} id="valeurs" title="Nos valeurs" />
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {values.map((value, i) => (
                  <li
                    key={value.text}
                    className="flex flex-col gap-3 rounded-card border border-t-4 border-vt-border border-t-vt-yellow bg-vt-surface p-7"
                  >
                    <span
                      aria-hidden="true"
                      className="font-display text-[2.75rem] leading-[0.9] font-extrabold text-vt-terracotta"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {value.title && (
                      <h3 className="text-[2rem] leading-none font-extrabold">{value.title}</h3>
                    )}
                    <p className="text-ui leading-[1.6] font-normal text-vt-text-prose">
                      {value.text}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="bureau" className="vt-container vt-gutter pb-16 lg:pb-[88px]">
              <SectionHead number={3} id="bureau" title="Le bureau" />
              {clubInfo.boardMembers.length === 0 ? (
                <p className="text-vt-text-prose">La composition du bureau sera bientôt publiée.</p>
              ) : (
                <ul className="grid md:grid-cols-2 md:gap-x-12">
                  {clubInfo.boardMembers.map((member, i) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-4 border-t border-vt-ink/12 py-5"
                    >
                      <span
                        aria-hidden="true"
                        className="w-12 font-display text-4xl font-extrabold text-vt-terracotta"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="flex flex-col">
                        <span className="font-display text-[1.625rem] font-extrabold uppercase">
                          {boardMemberName(member)}
                          <span className="sr-only"> — </span>
                        </span>
                        <span className="text-small font-bold tracking-[0.1em] text-vt-text-muted uppercase">
                          {member.role}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {clubInfo.teamInfo && (
                <p className="mt-8 max-w-[720px] text-[1.0625rem] leading-[1.7] text-vt-text-prose">
                  {clubInfo.teamInfo}
                </p>
              )}
            </section>
          </>
        )}

        <section className="bg-vt-yellow">
          <div className="vt-container vt-gutter flex flex-col items-start gap-6 py-8 md:flex-row md:items-center md:justify-between">
            <p className="font-display text-[1.75rem] leading-tight font-extrabold uppercase md:text-[2.125rem]">
              Envie de rejoindre le club&nbsp;?
            </p>
            <LinkButton href="/contact?sujet=adhesion" variant="dark">
              Nous contacter
            </LinkButton>
          </div>
        </section>
      </main>
    </>
  );
}
