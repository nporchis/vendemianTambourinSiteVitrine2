// État vide explicite (FR-011, planche « États ») : encadré pointillé, icône, titre, texte.
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  headingLevel?: "h2" | "h3";
};

export function EmptyState({ icon: Icon, title, children, headingLevel = "h2" }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-card border border-dashed border-vt-ink/25 bg-vt-surface px-8 py-12 text-center"
    >
      <Icon aria-hidden="true" size={40} strokeWidth={1.8} className="text-vt-terracotta" />
      <Heading className="text-[1.625rem] leading-tight font-extrabold">{title}</Heading>
      <p className="max-w-[440px] text-vt-text-secondary">{children}</p>
    </div>
  );
}
