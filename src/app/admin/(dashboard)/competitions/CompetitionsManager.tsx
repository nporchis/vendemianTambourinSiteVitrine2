"use client";

// Liste + création/édition/suppression des compétitions (T023), triée à venir/passées.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { splitCompetitions, type CompetitionDto } from "@/lib/competitions";
import { CompetitionForm } from "./CompetitionForm";

export function CompetitionsManager({ competitions }: { competitions: CompetitionDto[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { upcoming, past } = splitCompetitions(competitions);

  async function onDelete(id: string) {
    if (!confirm("Supprimer cette compétition ?")) return;
    await fetch(`/api/admin/competitions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function renderList(items: CompetitionDto[], title: string) {
    if (items.length === 0) return null;
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-[1.375rem] font-extrabold">{title}</h2>
        <ul className="flex flex-col gap-3">
          {items.map((c) =>
            editingId === c.id ? (
              <li key={c.id}>
                <CompetitionForm competition={c} onSaved={() => setEditingId(null)} onCancel={() => setEditingId(null)} />
              </li>
            ) : (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-vt-border bg-vt-surface p-4"
              >
                <div>
                  <p className="font-extrabold">{c.name}</p>
                  <p className="text-small text-vt-text-secondary">
                    {new Date(c.date).toLocaleDateString("fr-FR")} — {c.location}
                    {c.result ? ` — ${c.result}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={buttonClass("outline-light")} onClick={() => setEditingId(c.id)}>
                    Éditer
                  </button>
                  <button type="button" className={buttonClass("outline-light")} onClick={() => onDelete(c.id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        {creating ? (
          <CompetitionForm onSaved={() => setCreating(false)} onCancel={() => setCreating(false)} />
        ) : (
          <button type="button" className={buttonClass("primary")} onClick={() => setCreating(true)}>
            Ajouter une compétition
          </button>
        )}
      </div>
      {renderList(upcoming, "À venir")}
      {renderList(past, "Passées")}
      {competitions.length === 0 && <p className="text-vt-text-secondary">Aucune compétition.</p>}
    </div>
  );
}
