// En-tête de section numéroté « 01 » (T013b, design-system.md §4.13) : chiffre jaune
// contouré décoratif, h2 géant, lien optionnel. Mobile : chiffre au-dessus, lien dessous.
import Link from "next/link";

type SectionHeadProps = {
  number: number;
  title: string;
  id?: string;
  link?: { href: string; label: string };
  onDark?: boolean;
};

export function SectionHead({ number, title, id, link, onDark = false }: SectionHeadProps) {
  return (
    <div
      className={`mb-8 flex flex-col gap-2 border-b-2 pb-[18px] md:mb-9 md:grid md:grid-cols-[auto_1fr_auto] md:items-end md:gap-6 ${
        onDark ? "border-vt-cream/20" : "border-vt-ink"
      }`}
    >
      <span
        aria-hidden="true"
        data-deco={String(number).padStart(2, "0")}
        className="vt-stroke font-display text-section-number font-extrabold"
      />
      <h2
        id={id}
        className={`text-section-head font-extrabold ${onDark ? "text-vt-cream" : "text-vt-ink"}`}
      >
        {title}
      </h2>
      {link ? (
        <Link
          href={link.href}
          className="text-small font-extrabold tracking-[0.06em] whitespace-nowrap text-vt-terracotta uppercase"
        >
          {link.label} <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span className="hidden md:block" />
      )}
    </div>
  );
}
