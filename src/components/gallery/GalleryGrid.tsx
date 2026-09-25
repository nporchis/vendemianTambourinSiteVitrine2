// Grille photo (T034, FR-004, design-system.md §4.9) : composant de présentation sans état
// ni hook ; la première page est rendue côté serveur, les suivantes sont ajoutées par
// GalleryBrowser. `next/image` assure le lazy-loading et les tailles responsive.
import Image from "next/image";
import type { PhotoCategoryDto, PhotoDto } from "@/lib/photos";

type GalleryGridProps = {
  photos: PhotoDto[];
  categories: PhotoCategoryDto[];
  /** Nombre de tuiles squelettes à afficher pendant un chargement. */
  loadingCount?: number;
  /** Premières photos chargées sans attendre (première rangée, candidate au LCP). */
  eagerCount?: number;
};

export const galleryGridClass = "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4";

export function GalleryGrid({
  photos,
  categories,
  loadingCount = 0,
  eagerCount = 0,
}: GalleryGridProps) {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <ul className={galleryGridClass}>
      {photos.map((photo, index) => {
        const category = categoryName.get(photo.categoryId);
        return (
          <li key={photo.id}>
            <figure className="flex flex-col gap-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-[#e4dfd0]">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption ?? (category ? `Photo — ${category}` : "Photo du club")}
                  fill
                  loading={index < eagerCount ? "eager" : "lazy"}
                  fetchPriority={index === 0 && eagerCount > 0 ? "high" : undefined}
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex flex-col">
                {photo.caption && (
                  <span className="text-small font-semibold text-vt-text-secondary">
                    {photo.caption}
                  </span>
                )}
                {category && (
                  <span className="text-xs font-bold tracking-[0.06em] text-vt-text-muted uppercase">
                    {category}
                  </span>
                )}
              </figcaption>
            </figure>
          </li>
        );
      })}
      {Array.from({ length: loadingCount }, (_, i) => (
        <li key={`skeleton-${i}`} aria-hidden="true">
          <div className="vt-skeleton aspect-[4/3] rounded-control" />
        </li>
      ))}
    </ul>
  );
}
