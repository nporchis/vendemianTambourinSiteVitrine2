// Layout du backoffice (T018) : navigation entre sections, déconnexion — utilisé par toutes les
// pages `/admin/**` sauf login/reset (qui définissent leur propre <main>, sans cette nav).
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/competitions", label: "Compétitions" },
  { href: "/admin/galerie", label: "Galerie" },
  { href: "/admin/club", label: "Club" },
  { href: "/admin/partenaires", label: "Partenaires" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/comptes", label: "Comptes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-vt-border bg-vt-surface px-6 py-4">
        <nav aria-label="Sections du backoffice" className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-small font-bold hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </header>
      <main id="contenu" tabIndex={-1} className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
