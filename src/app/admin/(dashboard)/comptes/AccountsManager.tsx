"use client";

// Liste des comptes + création/désactivation/réactivation/suppression + journal d'audit lecture
// seule (T027, FR-003, FR-004, FR-017).
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";
import type { AuditLogEntryDto } from "@/lib/audit-log";

type AdminDto = { id: string; email: string; active: boolean; createdAt: string };

const ACTION_LABELS: Record<string, string> = {
  admin_created: "Compte créé",
  admin_updated: "Compte modifié",
  admin_deactivated: "Compte désactivé",
  admin_reactivated: "Compte réactivé",
  admin_deleted: "Compte supprimé",
};

function CreateAccountForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        setEmail("");
        setPassword("");
        onCreated();
        router.refresh();
      } else {
        const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
        setErrors(body.errors ?? { form: "Création impossible." });
      }
    } catch {
      setErrors({ form: "La connexion a échoué." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-5">
      <h2 className="font-extrabold">Ajouter un administrateur</h2>
      <AdminField id="new-email" label="Email" required error={errors.email}>
        <input
          id="new-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </AdminField>
      <AdminField id="new-password" label="Mot de passe (12 caractères minimum)" required error={errors.password}>
        <input
          id="new-password"
          type="password"
          minLength={12}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </AdminField>
      {errors.form && <FormMessage kind="error" message={errors.form} />}
      <button type="submit" disabled={submitting} className={buttonClass("primary")}>
        {submitting ? "Création…" : "Créer le compte"}
      </button>
    </form>
  );
}

export function AccountsManager({
  admins,
  auditLog,
}: {
  admins: AdminDto[];
  auditLog: AuditLogEntryDto[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function toggleActive(a: AdminDto) {
    setError(null);
    const response = await fetch(`/api/admin/admins/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !a.active }),
    });
    if (response.ok) {
      router.refresh();
    } else {
      const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
      setError(Object.values(body.errors ?? {})[0] ?? "Action impossible.");
    }
  }

  async function remove(a: AdminDto) {
    if (!confirm(`Supprimer le compte ${a.email} ?`)) return;
    setError(null);
    const response = await fetch(`/api/admin/admins/${a.id}`, { method: "DELETE" });
    if (response.ok || response.status === 204) {
      router.refresh();
    } else {
      const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
      setError(Object.values(body.errors ?? {})[0] ?? "Suppression impossible.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <CreateAccountForm onCreated={() => setError(null)} />

      {error && <FormMessage kind="error" message={error} />}

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.375rem] font-extrabold">Comptes</h2>
        <ul className="flex flex-col gap-3">
          {admins.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-vt-border bg-vt-surface p-4"
            >
              <div>
                <p className="font-extrabold">{a.email}</p>
                <p className="text-small text-vt-text-secondary">{a.active ? "Actif" : "Désactivé"}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className={buttonClass("outline-light")} onClick={() => toggleActive(a)}>
                  {a.active ? "Désactiver" : "Réactiver"}
                </button>
                <button type="button" className={buttonClass("outline-light")} onClick={() => remove(a)}>
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[1.375rem] font-extrabold">Journal d&apos;audit</h2>
        <ul className="flex flex-col gap-2">
          {auditLog.map((entry) => (
            <li key={entry.id} className="text-small text-vt-text-secondary">
              {new Date(entry.createdAt).toLocaleString("fr-FR")} — {entry.actorEmail ?? "compte supprimé"} :{" "}
              {ACTION_LABELS[entry.action] ?? entry.action}
              {entry.targetEmail ? ` (${entry.targetEmail})` : ""}
            </li>
          ))}
          {auditLog.length === 0 && <li className="text-small text-vt-text-secondary">Aucune entrée.</li>}
        </ul>
      </section>
    </div>
  );
}
