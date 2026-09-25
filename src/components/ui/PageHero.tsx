// Bandeau de page à titre géant (T013b, design-system.md §4.4) : eyebrow jaune, h1 crème
// avec un mot surligné (<Highlight>), chapô.
import type { ReactNode } from "react";

/** Mot-clé surligné d'un titre géant : emphase sémantique (design-system.md §2). */
export function Highlight({ children }: { children: ReactNode }) {
  return <em className="vt-hl">{children}</em>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-small font-bold tracking-eyebrow text-vt-yellow uppercase">
      <span aria-hidden="true" className="inline-block h-[3px] w-[22px] bg-vt-yellow" />
      {children}
    </span>
  );
}

type PageHeroProps = { eyebrow: string; title: ReactNode; lead?: ReactNode };

export function PageHero({ eyebrow, title, lead }: PageHeroProps) {
  return (
    <section className="vt-on-dark bg-vt-ink">
      <div className="vt-container vt-gutter pt-12 pb-10 md:pt-16 md:pb-14 lg:pt-20 lg:pb-[72px]">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-5 max-w-[1100px] text-page-title font-extrabold tracking-[0.005em] text-vt-cream lg:mt-[22px]">
          {title}
        </h1>
        {lead && (
          <p className="mt-6 max-w-[640px] text-base leading-[1.55] text-vt-text-on-dark md:mt-7 md:text-[1.1875rem]">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
