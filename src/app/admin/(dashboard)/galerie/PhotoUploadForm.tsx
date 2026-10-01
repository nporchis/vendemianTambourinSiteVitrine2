"use client";

// Téléversement de photo (T032) : sélection ou création de catégorie, aperçu avant envoi.
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminField, FormMessage, inputClass } from "@/components/admin/AdminField";
import { buttonClass } from "@/components/ui/Button";
import type { PhotoCategoryDto } from "@/lib/photos";

export function PhotoUploadForm({ categories }: { categories: PhotoCategoryDto[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function onFileChange(selected: File | null) {
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      let finalCategoryId = categoryId;
      if (newCategoryName.trim()) {
        const created = await fetch("/api/admin/photo-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategoryName.trim() }),
        });
        if (!created.ok) {
          setErrors({ newCategoryName: "Création de la catégorie impossible." });
          return;
        }
        finalCategoryId = ((await created.json()) as { id: string }).id;
      }
      if (!file) {
        setErrors({ file: "Fichier requis." });
        return;
      }

      const form = new FormData();
      form.set("file", file);
      form.set("categoryId", finalCategoryId);
      if (caption) form.set("caption", caption);

      const response = await fetch("/api/admin/photos", { method: "POST", body: form });
      if (response.ok) {
        setCaption("");
        setNewCategoryName("");
        onFileChange(null);
        router.refresh();
      } else {
        const body = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
        setErrors(body.errors ?? { form: "Envoi impossible." });
      }
    } catch {
      setErrors({ form: "La connexion a échoué." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-card border border-vt-border bg-vt-surface p-5"
    >
      <h2 className="font-extrabold">Ajouter une photo</h2>

      <AdminField id="photo-file" label="Fichier (JPEG, PNG ou WebP, 10 Mo max)" required error={errors.file}>
        <input
          id="photo-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </AdminField>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Aperçu" className="h-32 w-auto rounded-control object-cover" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField id="category" label="Catégorie existante" error={errors.categoryId}>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField id="new-category" label="Ou nouvelle catégorie" error={errors.newCategoryName}>
          <input
            id="new-category"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className={inputClass}
          />
        </AdminField>
      </div>

      <AdminField id="caption" label="Légende" error={errors.caption}>
        <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
      </AdminField>

      {errors.form && <FormMessage kind="error" message={errors.form} />}

      <div>
        <button type="submit" disabled={submitting} className={buttonClass("primary")}>
          {submitting ? "Envoi…" : "Téléverser"}
        </button>
      </div>
    </form>
  );
}
