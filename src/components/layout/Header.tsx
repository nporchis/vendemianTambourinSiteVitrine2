// En-tête commun (T013, FR-027) : écusson vers l'accueil, navigation avec page courante
// signalée par `aria-current`. Variante « overlay » au-dessus du hero de l'accueil,
// « solid » (fond sombre) sur les pages intérieures (design-system.md §4.1).
import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/brand/logo-vendemian-tambourin.png";
import { MobileMenu } from "./MobileMenu";
import { NAV_ITEMS, type NavHref } from "./nav-items";

type HeaderProps = {
  current: NavHref | null;
  variant?: "overlay" | "solid";
};

export function Header({ current, variant = "solid" }: HeaderProps) {
  return (
    <header
      className={
        variant === "overlay"
          ? "vt-on-dark relative z-10"
          : "vt-on-dark border-b border-vt-border-header bg-vt-ink"
      }
    >
      <div className="vt-container vt-gutter flex items-center justify-between gap-6 py-3">
        <Link
          href="/"
          aria-label="Vendémian Tambourin — accueil"
          className="flex shrink-0 items-center"
        >
          <Image src={logo} alt="" priority className="h-11 w-auto lg:h-[52px]" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex gap-6">
            {NAV_ITEMS.map((item) => {
              const isCurrent = item.href === current;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`text-ui font-semibold tracking-ui uppercase transition-colors hover:text-vt-yellow ${
                      isCurrent ? "text-vt-yellow" : "text-vt-text-on-dark"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <MobileMenu current={current} overlay={variant === "overlay"} />
      </div>
    </header>
  );
}
