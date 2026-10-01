// Tableau de bord (/admin) — point d'entrée après connexion (T018).
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tableau de bord" };

const SECTIONS = [
  { href: "/admin/competitions", label: "Compétitions", description: "Calendrier des matchs" },
  { href: "/admin/galerie", label: "Galerie", description: "Photos et catégories" },
  { href: "/admin/club", label: "Club", description: "Présentation, chiffres clés, bureau" },
  { href: "/admin/partenaires", label: "Partenaires", description: "Logos et niveaux" },
  { href: "/admin/contacts", label: "Contacts", description: "Demandes reçues" },
  { href: "/admin/comptes", label: "Comptes", description: "Administrateurs et journal d'audit" },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[1.75rem] font-extrabold">Tableau de bord</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="block rounded-card border border-vt-border bg-vt-surface p-5 hover:border-vt-ink"
            >
              <p className="font-extrabold">{section.label}</p>
              <p className="text-small text-vt-text-secondary">{section.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
