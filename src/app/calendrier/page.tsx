// Calendrier & résultats (T028, FR-003, FR-011, FR-016) — rendu à chaque requête
// (research.md §20). Filtre « Toutes / À venir / Passées » par URL (?filtre=), sans JS.
import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionList } from "@/components/competitions/CompetitionList";
import { Header } from "@/components/layout/Header";
import { chipClass } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight, PageHero } from "@/components/ui/PageHero";
import { SectionHead } from "@/components/ui/SectionHead";
import { listCompetitions, splitCompetitions } from "@/lib/competitions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendrier & résultats",
  description: "Les matchs du Vendémian Tambourin : compétitions à venir et derniers résultats.",
};

const FILTERS = [
  { value: null, label: "Toutes" },
  { value: "a-venir", label: "À venir" },
  { value: "passees", label: "Passées" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

function parseFilter(value: string | string[] | undefined): Filter {
  return value === "a-venir" || value === "passees" ? value : null;
}

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = parseFilter((await searchParams).filtre);
  const now = new Date();
  const competitions = await listCompetitions(await getDb(), now);
  const { upcoming, past } = splitCompetitions(competitions);
  const showUpcoming = filter !== "passees";
  const showPast = filter !== "a-venir";
  let section = 0;

  return (
    <>
      <Header current="/calendrier" />
      <main id="contenu" tabIndex={-1} className="flex-1">
        <PageHero
          eyebrow="Compétitions"
          title={
            <>
              Calendrier
              <br />
              <Highlight>&amp;</Highlight> résultats.
            </>
          }
          lead="Tous les matchs du club, à venir et passés, avec les résultats des compétitions déjà jouées."
        />

        {competitions.length === 0 ? (
          <div className="vt-container vt-gutter py-16 lg:py-[88px]">
            <EmptyState icon={CalendarDays} title="Aucune compétition programmée">
              Le calendrier de la saison n&apos;est pas encore publié. Revenez bientôt ou suivez le
              club sur ses réseaux.
            </EmptyState>
          </div>
        ) : (
          <>
            <nav aria-label="Filtrer les compétitions" className="vt-container vt-gutter pt-10">
              <ul className="flex flex-wrap gap-3">
                {FILTERS.map((f) => (
                  <li key={f.label}>
                    <Link
                      href={f.value ? `/calendrier?filtre=${f.value}` : "/calendrier"}
                      aria-current={filter === f.value ? "true" : undefined}
                      className={chipClass(filter === f.value)}
                    >
                      {f.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {showUpcoming && (
              <section aria-labelledby="a-venir" className="vt-container vt-gutter pt-12 pb-6">
                <SectionHead number={++section} id="a-venir" title="À venir" />
                {upcoming.length > 0 ? (
                  <CompetitionList competitions={upcoming} now={now} />
                ) : (
                  <p className="text-lg text-vt-text-prose">
                    Aucune compétition n&apos;est planifiée pour le moment.
                  </p>
                )}
              </section>
            )}

            {showPast && (
              <section
                aria-labelledby="resultats"
                className="vt-container vt-gutter pt-12 pb-16 lg:pb-[88px]"
              >
                <SectionHead number={++section} id="resultats" title="Derniers résultats" />
                {past.length > 0 ? (
                  <CompetitionList competitions={past} now={now} />
                ) : (
                  <p className="text-lg text-vt-text-prose">
                    Aucune compétition jouée pour le moment.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
