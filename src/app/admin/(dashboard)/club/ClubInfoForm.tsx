"use client";

// Présentation, chiffres clés (4 au plus), coordonnées, réseaux (T037).
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";
import type { ClubInfoDto } from "@/lib/club-info";

const MAX_KEY_FIGURES = 4;

type KeyFigure = { value: string; label: string };
type SocialLink = { label: string; url: string };

export function ClubInfoForm({ clubInfo }: { clubInfo: ClubInfoDto | null }) {
  const router = useRouter();
  const [historyText, setHistoryText] = useState(clubInfo?.historyText ?? "");
  const [values, setValues] = useState(clubInfo?.values ?? "");
  const [teamInfo, setTeamInfo] = useState(clubInfo?.teamInfo ?? "");
  const [contactEmail, setContactEmail] = useState(clubInfo?.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(clubInfo?.contactPhone ?? "");
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>(clubInfo?.keyFigures ?? []);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(clubInfo?.socialLinks ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSaved(false);
    try {
      const response = await fetch("/api/admin/club-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historyText,
          values,
          teamInfo: teamInfo || null,
          contactEmail,
          contactPhone: contactPhone || null,
          keyFigures,
          socialLinks,
        }),
      });
      if (response.ok) {
        setSaved(true);
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
      <h2 className="font-extrabold">Présentation du club</h2>

      <AdminField id="historyText" label="Histoire" required error={errors.historyText}>
        <textarea
          id="historyText"
          required
          value={historyText}
          onChange={(e) => setHistoryText(e.target.value)}
          rows={6}
          className={`${inputClass} h-auto py-2`}
        />
      </AdminField>

      <AdminField id="values" label="Valeurs" required error={errors.values}>
        <textarea
          id="values"
          required
          value={values}
          onChange={(e) => setValues(e.target.value)}
          rows={4}
          className={`${inputClass} h-auto py-2`}
        />
      </AdminField>

      <AdminField id="teamInfo" label="Infos équipe" error={errors.teamInfo}>
        <textarea
          id="teamInfo"
          value={teamInfo}
          onChange={(e) => setTeamInfo(e.target.value)}
          rows={3}
          className={`${inputClass} h-auto py-2`}
        />
      </AdminField>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField id="contactEmail" label="Email de contact" required error={errors.contactEmail}>
          <input
            id="contactEmail"
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={inputClass}
          />
        </AdminField>
        <AdminField id="contactPhone" label="Téléphone" error={errors.contactPhone}>
          <input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={inputClass}
          />
        </AdminField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-meta font-bold">Chiffres clés (4 au plus)</legend>
        {keyFigures.map((figure, index) => (
          <div key={index} className="flex gap-2">
            <input
              aria-label={`Valeur du chiffre clé ${index + 1}`}
              value={figure.value}
              maxLength={8}
              onChange={(e) =>
                setKeyFigures((figs) => figs.map((f, i) => (i === index ? { ...f, value: e.target.value } : f)))
              }
              className={`${inputClass} w-24`}
            />
            <input
              aria-label={`Libellé du chiffre clé ${index + 1}`}
              value={figure.label}
              onChange={(e) =>
                setKeyFigures((figs) => figs.map((f, i) => (i === index ? { ...f, label: e.target.value } : f)))
              }
              className={inputClass}
            />
            <button
              type="button"
              className={buttonClass("outline-light")}
              onClick={() => setKeyFigures((figs) => figs.filter((_, i) => i !== index))}
            >
              Retirer
            </button>
          </div>
        ))}
        {keyFigures.length < MAX_KEY_FIGURES && (
          <button
            type="button"
            className={buttonClass("outline-light")}
            onClick={() => setKeyFigures((figs) => [...figs, { value: "", label: "" }])}
          >
            Ajouter un chiffre clé
          </button>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-meta font-bold">Réseaux sociaux</legend>
        {socialLinks.map((link, index) => (
          <div key={index} className="flex gap-2">
            <input
              aria-label={`Libellé du réseau ${index + 1}`}
              value={link.label}
              onChange={(e) =>
                setSocialLinks((links) => links.map((l, i) => (i === index ? { ...l, label: e.target.value } : l)))
              }
              className={inputClass}
            />
            <input
              aria-label={`URL du réseau ${index + 1}`}
              value={link.url}
              onChange={(e) =>
                setSocialLinks((links) => links.map((l, i) => (i === index ? { ...l, url: e.target.value } : l)))
              }
              className={inputClass}
            />
            <button
              type="button"
              className={buttonClass("outline-light")}
              onClick={() => setSocialLinks((links) => links.filter((_, i) => i !== index))}
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          className={buttonClass("outline-light")}
          onClick={() => setSocialLinks((links) => [...links, { label: "", url: "" }])}
        >
          Ajouter un réseau
        </button>
      </fieldset>

      {errors.form && <FormMessage kind="error" message={errors.form} />}
      {saved && <FormMessage kind="success" message="Informations enregistrées." />}

      <div>
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
