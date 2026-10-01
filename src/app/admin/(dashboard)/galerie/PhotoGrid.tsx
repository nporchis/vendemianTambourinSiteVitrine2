"use client";

// Grille des photos existantes avec suppression (T032).
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";
import type { PhotoCategoryDto, PhotoDto } from "@/lib/photos";

export function PhotoGrid({
  photos,
  categories,
}: {
  photos: PhotoDto[];
  categories: PhotoCategoryDto[];
}) {
  const router = useRouter();
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  async function onDelete(id: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (photos.length === 0) return <p className="text-vt-text-secondary">Aucune photo.</p>;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {photos.map((p) => (
        <li key={p.id} className="flex flex-col gap-2 rounded-card border border-vt-border bg-vt-surface p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl} alt={p.caption ?? ""} className="aspect-square w-full rounded-control object-cover" />
          <p className="text-small font-bold">{nameById.get(p.categoryId) ?? p.categoryId}</p>
          {p.caption && <p className="text-small text-vt-text-secondary">{p.caption}</p>}
          <button type="button" className={buttonClass("outline-light", "text-small")} onClick={() => onDelete(p.id)}>
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  );
}
