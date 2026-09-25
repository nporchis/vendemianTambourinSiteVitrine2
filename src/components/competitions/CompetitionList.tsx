// Lignes de compétition (T027, FR-003, FR-016, design-system.md §4.8) : à venir (liseré
// jaune) ou passées (fond désaturé, résultat si renseigné).
import type { CompetitionDto } from "@/lib/competitions";
import { formatDateTime, formatDayOfMonth, formatMonthShort } from "@/lib/format";

/** « Défaite… » en terracotta, tout autre résultat en encre ; le libellé reste lisible. */
function resultClass(result: string) {
  return /^d[ée]faite/i.test(result.trim())
    ? "bg-vt-terracotta text-vt-cream"
    : "bg-vt-ink text-vt-cream";
}

function CompetitionRow({ competition, now }: { competition: CompetitionDto; now: Date }) {
  const date = new Date(competition.date);
  const upcoming = competition.status === "upcoming";

  return (
    <li
      className={`flex flex-col gap-4 rounded-card border px-5 py-5 sm:flex-row sm:items-center sm:gap-6 md:px-7 ${
        upcoming
          ? "border-vt-border border-l-4 border-l-vt-yellow bg-vt-surface md:py-6"
          : "border-vt-border-subtle bg-vt-surface-muted"
      }`}
    >
      <div
        aria-hidden="true"
        className="flex w-[72px] shrink-0 flex-row items-baseline gap-2 sm:flex-col sm:items-center sm:gap-0"
      >
        <span
          className={`text-small font-bold uppercase ${upcoming ? "text-vt-terracotta" : "text-vt-text-muted"}`}
        >
          {formatMonthShort(date)}
        </span>
        <span
          className={`font-display leading-none font-extrabold ${
            upcoming ? "text-[2.75rem] text-vt-ink" : "text-[2.5rem] text-vt-text-secondary"
          }`}
        >
          {formatDayOfMonth(date)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3
            className={`font-extrabold ${upcoming ? "text-2xl" : "text-[1.375rem] text-vt-text-secondary"}`}
          >
            {competition.name}
          </h3>
          {upcoming && (
            <span className="rounded-pill bg-vt-yellow px-2.5 py-0.5 text-micro font-extrabold tracking-label text-vt-ink uppercase">
              À venir
            </span>
          )}
        </div>
        <p className={`text-ui ${upcoming ? "text-vt-text-secondary" : "text-vt-text-muted"}`}>
          <time dateTime={competition.date}>{formatDateTime(date, now)}</time> —{" "}
          {competition.location}
        </p>
        {competition.description && (
          <p className="mt-1.5 text-ui text-vt-text-muted">{competition.description}</p>
        )}
      </div>

      {!upcoming && competition.result && (
        <p
          className={`shrink-0 self-start rounded-control px-4 py-2 font-display text-[1.375rem] font-extrabold sm:self-center ${resultClass(competition.result)}`}
        >
          <span className="sr-only">Résultat : </span>
          {competition.result}
        </p>
      )}
    </li>
  );
}

export function CompetitionList({
  competitions,
  now = new Date(),
}: {
  competitions: CompetitionDto[];
  now?: Date;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {competitions.map((competition) => (
        <CompetitionRow key={competition.id} competition={competition} now={now} />
      ))}
    </ul>
  );
}
