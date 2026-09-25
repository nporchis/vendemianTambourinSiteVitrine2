// Tuiles partenaires (T043, FR-005, design-system.md §4.16) : jaunes pour les partenaires
// principaux, blanches sinon ; lien vers le site dans un nouvel onglet s'il est renseigné.
import Image from "next/image";
import type { PartnerDto, PartnerLevel } from "@/lib/partners";

const GRID: Record<PartnerLevel, string> = {
  principal: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
  soutien: "grid grid-cols-2 gap-4 lg:grid-cols-4",
  institutionnel: "grid grid-cols-2 gap-4 lg:grid-cols-3",
};

function TileContent({ partner }: { partner: PartnerDto }) {
  const external = partner.websiteUrl && (
    <span className="sr-only"> (site du partenaire, nouvel onglet)</span>
  );

  if (partner.level === "principal") {
    return (
      <>
        <span className="self-start rounded-control bg-vt-ink px-2.5 py-1 text-micro font-extrabold tracking-[0.1em] text-vt-yellow uppercase">
          Principal
        </span>
        {partner.logoUrl ? (
          <Image
            src={partner.logoUrl}
            alt={partner.name}
            width={240}
            height={64}
            className="h-16 w-auto object-contain object-left"
          />
        ) : (
          <span className="font-display text-[2.125rem] leading-[0.95] font-extrabold uppercase">
            {partner.name}
          </span>
        )}
        {(partner.description || partner.websiteUrl) && (
          <span className="text-meta font-semibold">
            {partner.description}
            {partner.websiteUrl && <span aria-hidden="true"> ↗</span>}
          </span>
        )}
        {external}
      </>
    );
  }

  return (
    <>
      {partner.logoUrl ? (
        <Image
          src={partner.logoUrl}
          alt={partner.name}
          width={200}
          height={64}
          className="max-h-16 w-auto object-contain"
        />
      ) : (
        <span className="font-display text-2xl leading-none font-extrabold uppercase">
          {partner.name}
        </span>
      )}
      {partner.description && (
        <span className="mt-2 text-small text-vt-text-secondary">{partner.description}</span>
      )}
      {external}
    </>
  );
}

export function PartnerTiles({ level, partners }: { level: PartnerLevel; partners: PartnerDto[] }) {
  const tileClass =
    level === "principal"
      ? "flex h-full min-h-[180px] flex-col justify-between gap-4 rounded-card bg-vt-yellow p-7 text-vt-ink"
      : "flex h-full min-h-[120px] flex-col items-center justify-center rounded-card border border-vt-ink/12 bg-vt-surface p-5 text-center text-vt-ink";

  return (
    <ul className={GRID[level]}>
      {partners.map((partner) => (
        <li key={partner.id}>
          {partner.websiteUrl ? (
            <a
              href={partner.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${tileClass} transition-shadow hover:text-vt-ink hover:shadow-vt-card-hover`}
            >
              <TileContent partner={partner} />
            </a>
          ) : (
            <div className={tileClass}>
              <TileContent partner={partner} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
