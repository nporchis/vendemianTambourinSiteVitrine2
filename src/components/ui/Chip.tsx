// Chip de filtre (T013b, design-system.md §4.6) : vrai <button> avec `aria-pressed`.
import type { ComponentProps } from "react";

type ChipProps = ComponentProps<"button"> & { selected: boolean };

export function chipClass(selected: boolean) {
  return `inline-flex min-h-11 items-center rounded-pill px-[22px] py-2.5 font-display text-meta font-bold tracking-ui uppercase transition-colors ${
    selected
      ? "bg-vt-ink text-vt-cream"
      : "border border-vt-border-strong text-vt-ink hover:border-vt-ink/30 hover:bg-vt-ink/5"
  }`;
}

export function Chip({ selected, className = "", type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`${chipClass(selected)} ${className}`}
      {...props}
    />
  );
}
