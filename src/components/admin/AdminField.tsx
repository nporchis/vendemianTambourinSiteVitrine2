// Champ de formulaire backoffice réutilisé par toutes les pages admin — hygiène d'accessibilité
// par défaut (label associé, erreur liée par aria-describedby), sans effort de conformité WCAG AA
// dédié (plan.md §II, portée réduite pour le backoffice).
import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-control border border-vt-ink/25 bg-vt-surface px-3.5 text-ui font-normal text-vt-ink focus-visible:border-vt-ink";

export function AdminField({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-meta font-bold">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-small font-semibold text-[#a33a31]">
          {error}
        </span>
      )}
    </div>
  );
}

export function FormMessage({ kind, message }: { kind: "success" | "error"; message: string }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-control border p-3 text-small font-semibold ${
        kind === "error"
          ? "border-[#a33a31]/35 bg-[#fbedeb] text-[#a33a31]"
          : "border-vt-border bg-vt-surface-muted text-vt-ink"
      }`}
    >
      {message}
    </div>
  );
}
