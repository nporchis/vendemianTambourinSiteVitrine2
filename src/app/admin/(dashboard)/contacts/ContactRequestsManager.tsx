"use client";

// Liste triée par date de réception, statut, actions marquer traité / supprimer (T045).
import { useRouter } from "next/navigation";
import { CONTACT_SUBJECT_LABELS, type ContactSubject } from "@/lib/contact-subjects";
import type { ContactRequestDto } from "@/lib/contact-requests";
import { buttonClass } from "@/components/ui/Button";

export function ContactRequestsManager({ requests }: { requests: ContactRequestDto[] }) {
  const router = useRouter();

  async function markProcessed(id: string) {
    await fetch(`/api/admin/contact-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processed: true }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cette demande ?")) return;
    await fetch(`/api/admin/contact-requests/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (requests.length === 0) return <p className="text-vt-text-secondary">Aucune demande.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 rounded-card border border-vt-border bg-vt-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-extrabold">
                {r.firstName} {r.lastName} — {CONTACT_SUBJECT_LABELS[r.subject as ContactSubject] ?? r.subject}
              </p>
              <p className="text-small text-vt-text-secondary">
                {new Date(r.submittedAt).toLocaleString("fr-FR")} — {r.email} —{" "}
                {r.processedAt ? "Traitée" : "Non traitée"}
              </p>
            </div>
            <div className="flex gap-2">
              {!r.processedAt && (
                <button type="button" className={buttonClass("outline-light")} onClick={() => markProcessed(r.id)}>
                  Marquer traitée
                </button>
              )}
              <button type="button" className={buttonClass("outline-light")} onClick={() => remove(r.id)}>
                Supprimer
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-small">{r.message}</p>
        </li>
      ))}
    </ul>
  );
}
