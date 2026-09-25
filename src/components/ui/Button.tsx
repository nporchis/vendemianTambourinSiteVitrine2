// Boutons (T013b, design-system.md §4.5) : rendus en <Link> quand `href` est fourni.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline-dark" | "dark" | "outline-light";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control font-display text-base font-extrabold tracking-ui uppercase transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  // Jaune : CTA principal (« Voir le calendrier », « Envoyer le message »)
  primary:
    "bg-vt-yellow px-[30px] py-[15px] text-vt-ink hover:bg-vt-yellow-hover hover:text-vt-ink",
  // Contour sur fond sombre (« Voir le calendrier » du hero)
  "outline-dark":
    "border-2 border-[#6b655a] px-7 py-[13px] text-vt-cream hover:bg-vt-cream/8 hover:text-vt-cream",
  // Sombre, sur fond jaune (« Nous contacter » des bandes d'appel)
  dark: "bg-vt-ink px-[30px] py-[15px] text-vt-cream hover:bg-[#2e2c27] hover:text-vt-cream",
  // Contour sur fond clair (« En savoir plus »)
  "outline-light":
    "border-2 border-vt-ink px-7 py-[13px] text-vt-ink hover:bg-vt-ink/5 hover:text-vt-ink",
};

export function buttonClass(variant: ButtonVariant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`;
}

type LinkButtonProps = {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export function LinkButton({ href, variant = "primary", className, children }: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
