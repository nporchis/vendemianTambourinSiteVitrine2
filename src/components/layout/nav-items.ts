// Navigation principale commune à toutes les pages (FR-027).
export const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/le-tambourin", label: "Le tambourin" },
  { href: "/le-club", label: "Le club" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/galerie", label: "Galerie" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];
