"use client";

// Liste ordonnée du bureau avec ajout/suppression (T037).
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";
import type { BoardMemberDto } from "@/lib/club-info";

export function BoardMembersManager({ members }: { members: BoardMemberDto[] }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastNameInitial, setLastNameInitial] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/admin/board-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastNameInitial, role }),
      });
      if (response.ok) {
        setFirstName("");
        setLastNameInitial("");
        setRole("");
        router.refresh();
      } else {
        const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
        setErrors(body.errors ?? { form: "Ajout impossible." });
      }
    } catch {
      setErrors({ form: "La connexion a échoué." });
    } finally {
      setSubmitting(false);
    }
  }

  async function onRemove(id: string) {
    await fetch(`/api/admin/board-members/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-5">
      <h2 className="font-extrabold">Bureau</h2>
      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3">
            <span>
              {m.firstName} {m.lastNameInitial.toUpperCase()}. — {m.role}
            </span>
            <button type="button" className={buttonClass("outline-light")} onClick={() => onRemove(m.id)}>
              Retirer
            </button>
          </li>
        ))}
        {members.length === 0 && <li className="text-small text-vt-text-secondary">Aucun membre.</li>}
      </ul>

      <form onSubmit={onAdd} noValidate className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
        <AdminField id="member-firstname" label="Prénom" required error={errors.firstName}>
          <input
            id="member-firstname"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </AdminField>
        <AdminField id="member-initial" label="Initiale" required error={errors.lastNameInitial}>
          <input
            id="member-initial"
            required
            maxLength={1}
            value={lastNameInitial}
            onChange={(e) => setLastNameInitial(e.target.value)}
            className={inputClass}
          />
        </AdminField>
        <AdminField id="member-role" label="Rôle" required error={errors.role}>
          <input id="member-role" required value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} />
        </AdminField>
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          Ajouter
        </button>
      </form>
      {errors.form && <FormMessage kind="error" message={errors.form} />}
    </div>
  );
}
