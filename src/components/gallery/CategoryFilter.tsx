"use client";

// Filtre de la galerie par catégorie (T035, FR-015) : chips `aria-pressed`, sans
// rechargement de page.
import { Chip } from "@/components/ui/Chip";
import type { PhotoCategoryDto } from "@/lib/photos";

type CategoryFilterProps = {
  categories: PhotoCategoryDto[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
};

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filtrer les photos par catégorie"
      className="flex flex-wrap gap-3"
    >
      <Chip selected={selected === null} onClick={() => onSelect(null)}>
        Tout
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={selected === category.id}
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Chip>
      ))}
    </div>
  );
}
