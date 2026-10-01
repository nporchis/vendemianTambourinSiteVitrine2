"use client";

// Liste groupée par niveau + création/édition/suppression (T041).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { groupPartnersByLevel, PARTNER_LEVEL_LABELS, type PartnerDto } from "@/lib/partners";
import { PartnerForm } from "./PartnerForm";

export function PartnersManager({ partners }: { partners: PartnerDto[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const groups = groupPartnersByLevel(partners);

  async function onDelete(id: string) {
    if (!confirm("Supprimer ce partenaire ?")) return;
    await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        {creating ? (
          <PartnerForm onSaved={() => setCreating(false)} onCancel={() => setCreating(false)} />
        ) : (
          <button type="button" className={buttonClass("primary")} onClick={() => setCreating(true)}>
            Ajouter un partenaire
          </button>
        )}
      </div>

      {groups.map((group) => (
        <section key={group.level} className="flex flex-col gap-3">
          <h2 className="text-[1.375rem] font-extrabold">{PARTNER_LEVEL_LABELS[group.level]}</h2>
          <ul className="flex flex-col gap-3">
            {group.partners.map((p) =>
              editingId === p.id ? (
                <li key={p.id}>
                  <PartnerForm partner={p} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
                </li>
              ) : (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-vt-border bg-vt-surface p-4"
                >
                  <div className="flex items-center gap-3">
                    {p.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" className="h-10 w-10 rounded-control object-contain" />
                    )}
                    <p className="font-extrabold">{p.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={buttonClass("outline-light")} onClick={() => setEditingId(p.id)}>
                      Éditer
                    </button>
                    <button type="button" className={buttonClass("outline-light")} onClick={() => onDelete(p.id)}>
                      Supprimer
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
      {partners.length === 0 && <p className="text-vt-text-secondary">Aucun partenaire.</p>}
    </div>
  );
}
