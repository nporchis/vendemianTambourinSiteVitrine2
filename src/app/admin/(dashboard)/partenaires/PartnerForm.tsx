"use client";

// Création/édition de partenaire avec upload de logo optionnel (T041).
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";
import { PARTNER_LEVEL_LABELS, PARTNER_LEVELS, type PartnerDto, type PartnerLevel } from "@/lib/partners";

export function PartnerForm({
  partner,
  onSaved,
  onCancel,
}: {
  partner?: PartnerDto;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(partner?.name ?? "");
  const [level, setLevel] = useState<PartnerLevel>(partner?.level ?? PARTNER_LEVELS[0]);
  const [websiteUrl, setWebsiteUrl] = useState(partner?.websiteUrl ?? "");
  const [description, setDescription] = useState(partner?.description ?? "");
  const [logo, setLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      const form = new FormData();
      form.set("name", name);
      form.set("level", level);
      if (websiteUrl) form.set("websiteUrl", websiteUrl);
      if (description) form.set("description", description);
      if (logo) form.set("logo", logo);

      const response = await fetch(partner ? `/api/admin/partners/${partner.id}` : "/api/admin/partners", {
        method: partner ? "PATCH" : "POST",
        body: form,
      });
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
      <AdminField id="partner-name" label="Nom" required error={errors.name}>
        <input id="partner-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </AdminField>
      <AdminField id="partner-level" label="Niveau" required error={errors.level}>
        <select
          id="partner-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as PartnerLevel)}
          className={inputClass}
        >
          {PARTNER_LEVELS.map((l) => (
            <option key={l} value={l}>
              {PARTNER_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </AdminField>
      <AdminField id="partner-website" label="Site web" error={errors.websiteUrl}>
        <input
          id="partner-website"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className={inputClass}
        />
      </AdminField>
      <AdminField id="partner-description" label="Description (120 caractères max)" error={errors.description}>
        <input
          id="partner-description"
          maxLength={120}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </AdminField>
      <AdminField id="partner-logo" label="Logo (JPEG, PNG ou WebP)" error={errors.file}>
        <input
          id="partner-logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
        />
      </AdminField>

      {errors.form && <FormMessage kind="error" message={errors.form} />}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          {submitting ? "Enregistrement…" : partner ? "Enregistrer" : "Créer"}
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
