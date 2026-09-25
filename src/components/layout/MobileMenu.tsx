"use client";

// Menu mobile (T013a, FR-010, FR-027, design-system.md §5) : panneau plein écran sombre en
// dialogue modal — focus piégé, Échap ferme, focus rendu au bouton d'ouverture.
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import logo from "../../../public/brand/logo-vendemian-tambourin.png";
import { NAV_ITEMS, type NavHref } from "./nav-items";

const buttonClass =
  "flex h-11 items-center justify-center gap-2 rounded-control border border-vt-cream/20 px-3 font-display text-ui font-bold tracking-label text-vt-cream uppercase";

export function MobileMenu({ current, overlay }: { current: NavHref | null; overlay: boolean }) {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    openButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={openButtonRef}
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`${buttonClass} ${overlay ? "bg-vt-ink/55" : ""}`}
      >
        <Menu aria-hidden="true" size={22} strokeWidth={2.2} />
        Menu
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu principal"
          className="vt-on-dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-vt-ink"
        >
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <Link
              href="/"
              aria-label="Vendémian Tambourin — accueil"
              onClick={() => setOpen(false)}
              className="flex items-center"
            >
              <Image src={logo} alt="" className="h-11 w-auto" />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Fermer le menu"
              onClick={close}
              className={buttonClass}
            >
              <X aria-hidden="true" size={22} strokeWidth={2.2} />
              Fermer
            </button>
          </div>

          <nav aria-label="Navigation principale" className="px-4 pt-6 md:px-6">
            <ul>
              {NAV_ITEMS.map((item) => {
                const isCurrent = item.href === current;
                return (
                  <li key={item.href} className="border-b border-vt-cream/10 last:border-b-0">
                    <Link
                      href={item.href}
                      aria-current={isCurrent ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-[60px] items-center gap-3 font-display text-[2rem] font-extrabold uppercase ${
                        isCurrent ? "text-vt-yellow" : "text-vt-cream hover:text-vt-yellow"
                      }`}
                    >
                      {isCurrent && (
                        <span aria-hidden="true" className="inline-block h-7 w-1.5 bg-vt-yellow" />
                      )}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-1.5 px-4 py-6 text-small text-vt-text-on-dark-muted md:px-6">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-eyebrow text-vt-yellow uppercase">
              <span aria-hidden="true" className="inline-block h-[3px] w-[18px] bg-vt-yellow" />
              Vendémian Tambourin
            </span>
            <span>Fronton Vendémianais</span>
          </div>
        </div>
      )}
    </div>
  );
}
