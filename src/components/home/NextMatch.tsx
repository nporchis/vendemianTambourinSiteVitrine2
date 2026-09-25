// Carte « Prochain match » (T019c, FR-025, design-system.md §4.14) : nom, date, heure et
// lieu de la prochaine compétition, puis le compte à rebours.
import Image from "next/image";
import logo from "../../../public/brand/logo-vendemian-tambourin.png";
import { formatDay, formatTime, hasTime } from "@/lib/format";
import type { NextCompetition } from "@/lib/next-competition";
import { Countdown } from "./Countdown";

export function NextMatch({ competition }: { competition: NextCompetition }) {
  const date = new Date(competition.date);
  // « Dimanche » / « 12 octobre, 15h00 » sur deux lignes, comme sur la maquette.
  const [weekday, ...rest] = formatDay(date).split(" ");
  const secondLine = rest.join(" ") + (hasTime(date) ? `, ${formatTime(date)}` : "");

  return (
    <div className="grid overflow-hidden rounded-card lg:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col gap-4 bg-vt-yellow p-6 text-vt-ink md:p-10">
        <span className="self-start rounded-control border-2 border-vt-ink px-2.5 py-1 text-xs font-extrabold tracking-[0.1em] uppercase">
          {competition.name}
        </span>
        <h3 className="text-[2.75rem] leading-[0.88] font-extrabold md:text-[4.75rem]">
          <time dateTime={competition.date}>
            {weekday}
            <br />
            {secondLine}
          </time>
        </h3>
        <p className="font-bold">{competition.location}</p>
      </div>

      <div className="vt-on-dark flex flex-col justify-between gap-6 bg-vt-ink p-6 text-vt-cream md:p-10">
        <div className="flex items-center gap-5">
          <Image src={logo} alt="" className="h-[72px] w-auto shrink-0" />
          <div>
            <p className="font-display text-[1.625rem] leading-none font-extrabold uppercase">
              Vendémian Tambourin
            </p>
            {competition.description && (
              <p className="mt-2 text-ui text-vt-text-on-dark">{competition.description}</p>
            )}
          </div>
        </div>
        <Countdown target={competition.date} />
      </div>
    </div>
  );
}
