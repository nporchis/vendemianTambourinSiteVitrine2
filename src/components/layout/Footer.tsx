// Pied de page commun (T013, FR-019, FR-027, design-system.md §4.2).
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
];

export function Footer() {
  return (
    <footer className="vt-on-dark bg-vt-ink text-small text-vt-text-on-dark-muted">
      <div className="vt-container vt-gutter flex flex-col items-center gap-3 py-6 text-center md:flex-row md:justify-between md:text-left">
        <p>© Vendémian Tambourin — Club de tambourin depuis 1923</p>
        <nav aria-label="Liens du pied de page">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block py-1 text-vt-text-on-dark-muted hover:text-vt-text-on-dark"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
