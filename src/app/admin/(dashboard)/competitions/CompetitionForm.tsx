"use client";

// Création/édition de compétition (T023) : champ résultat visible uniquement pour une date passée.
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";
import type { CompetitionDto } from "@/lib/competitions";

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function CompetitionForm({
  competition,
  onSaved,
  onCancel,
}: {
  competition?: CompetitionDto;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(competition?.name ?? "");
  const [date, setDate] = useState(competition ? toDateInputValue(competition.date) : "");
  const [location, setLocation] = useState(competition?.location ?? "");
  const [description, setDescription] = useState(competition?.description ?? "");
  const [result, setResult] = useState(competition?.result ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // Dérivé côté événement (onChange), jamais pendant le rendu : `Date.now()` y est impur.
  const [isPast, setIsPast] = useState(() => competition?.status === "past");

  function onDateChange(value: string) {
    setDate(value);
    setIsPast(value !== "" && new Date(value).getTime() < Date.now());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch(
        competition ? `/api/admin/competitions/${competition.id}` : "/api/admin/competitions",
        {
          method: competition ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            date,
            location,
            description: description || null,
            result: isPast ? result || null : null,
          }),
        },
      );
      if (response.ok) {
        onSaved();
        router.refresh();
      } else {
        const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
        setErrors(body.errors ?? { form: "Enregistrement impossible." });
      }
    } catch {
      setErrors({ form: "La connexion a échoué." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-5">
      <AdminField id="name" label="Nom" required error={errors.name}>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </AdminField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField id="date" label="Date" required error={errors.date}>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={inputClass}
          />
        </AdminField>
        <AdminField id="location" label="Lieu" required error={errors.location}>
          <input
            id="location"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </AdminField>
      </div>
      <AdminField id="description" label="Description" error={errors.description}>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} h-auto py-2`}
          rows={3}
        />
      </AdminField>
      {isPast && (
        <AdminField id="result" label="Résultat" error={errors.result}>
          <input id="result" value={result} onChange={(e) => setResult(e.target.value)} className={inputClass} />
        </AdminField>
      )}
      {errors.form && <FormMessage kind="error" message={errors.form} />}
      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          {submitting ? "Enregistrement…" : competition ? "Enregistrer" : "Créer"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={buttonClass("outline-light")}>
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
