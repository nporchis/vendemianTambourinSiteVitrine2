// Chiffres clés du club au pied du hero (T019c, FR-024, design-system.md §4.15) :
// 4 au plus, dans l'ordre saisi ; rien n'est rendu s'il n'y en a aucun.
import type { KeyFigure } from "../../../drizzle/schema";

export function KeyFigures({ figures }: { figures: KeyFigure[] }) {
  if (figures.length === 0) return null;
  return (
    <dl
      aria-label="Le club en chiffres"
      className="grid grid-cols-2 border-t border-vt-cream/20 md:grid-cols-4"
    >
      {figures.slice(0, 4).map((figure, i) => (
        <div
          key={`${figure.value}-${figure.label}`}
          className={`flex flex-col-reverse gap-1.5 py-5 md:border-r md:border-vt-cream/15 md:px-5 md:pt-[22px] md:pb-[26px] md:first:pl-0 md:last:border-r-0 ${
            i % 2 === 0 ? "pr-4" : "border-l border-vt-cream/15 pl-4 md:border-l-0"
          }`}
        >
          <dt className="text-xs font-bold tracking-[0.12em] text-[#c9c3b3] uppercase">
            {figure.label}
          </dt>
          <dd
            className={`font-display text-[2.5rem] leading-none font-extrabold md:text-[3.75rem] ${
              i === 0 ? "text-vt-yellow" : "text-vt-cream"
            }`}
          >
            {figure.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
