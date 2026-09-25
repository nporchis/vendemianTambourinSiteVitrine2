"use client";

// Galerie interactive (FR-015, FR-018) : filtre par catégorie, défilement infini par
// curseur (GET /api/photos), squelettes pendant le chargement, erreur récupérable.
// Fin de liste silencieuse (design-system.md §8).
import { AlertCircle, ImageIcon, LoaderCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PhotoCategoryDto, PhotoPage } from "@/lib/photos";
import { CategoryFilter } from "./CategoryFilter";
import { GalleryGrid } from "./GalleryGrid";
import { InfiniteScrollTrigger } from "./InfiniteScrollTrigger";

type GalleryBrowserProps = {
  categories: PhotoCategoryDto[];
  initialPage: PhotoPage;
};

type LoadState = "idle" | "loading" | "error";

async function fetchPage(categoryId: string | null, cursor: string | null): Promise<PhotoPage> {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/photos?${params}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function GalleryBrowser({ categories, initialPage }: GalleryBrowserProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState<PhotoPage>(initialPage);
  const [state, setState] = useState<LoadState>("idle");
  // Ignore les réponses d'une requête devenue obsolète (changement de filtre).
  const requestId = useRef(0);

  const load = useCallback(
    async (categoryId: string | null, cursor: string | null, append: boolean) => {
      const id = ++requestId.current;
      setState("loading");
      try {
        const next = await fetchPage(categoryId, cursor);
        if (id !== requestId.current) return;
        setPage((current) =>
          append ? { items: [...current.items, ...next.items], nextCursor: next.nextCursor } : next,
        );
        setState("idle");
      } catch {
        if (id === requestId.current) setState("error");
      }
    },
    [],
  );

  function selectCategory(categoryId: string | null) {
    if (categoryId === category) return;
    setCategory(categoryId);
    if (categoryId === null) {
      requestId.current++;
      setPage(initialPage);
      setState("idle");
    } else {
      setPage({ items: [], nextCursor: null });
      void load(categoryId, null, false);
    }
  }

  const loadMore = useCallback(() => {
    if (page.nextCursor) void load(category, page.nextCursor, true);
  }, [category, page.nextCursor, load]);

  const retry = () => (page.items.length === 0 ? void load(category, null, false) : loadMore());

  const loading = state === "loading";
  const empty = page.items.length === 0 && !loading && state !== "error";

  return (
    <div className="flex flex-col gap-8">
      {categories.length > 0 && (
        <CategoryFilter categories={categories} selected={category} onSelect={selectCategory} />
      )}

      {empty ? (
        <EmptyState icon={ImageIcon} title="Pas encore de photos" headingLevel="h2">
          Les photos des matchs et des événements du club apparaîtront ici.
        </EmptyState>
      ) : (
        <GalleryGrid photos={page.items} categories={categories} loadingCount={loading ? 4 : 0} />
      )}

      <InfiniteScrollTrigger
        enabled={state === "idle" && page.nextCursor !== null}
        onTrigger={loadMore}
        itemCount={page.items.length}
      />

      <div aria-live="polite">
        {loading && (
          <p
            role="status"
            className="flex items-center justify-center gap-3 text-meta font-semibold text-vt-text-secondary"
          >
            <LoaderCircle
              aria-hidden="true"
              size={20}
              className="animate-spin text-vt-terracotta"
            />
            Chargement de nouvelles photos…
          </p>
        )}
        {state === "error" && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-4 rounded-card border border-vt-terracotta/35 bg-[#fbedeb] px-6 py-4"
          >
            <AlertCircle aria-hidden="true" size={20} className="shrink-0 text-vt-terracotta" />
            <span className="flex-1 text-ui">
              {page.items.length === 0
                ? "Les photos n'ont pas pu être chargées."
                : "Les photos suivantes n'ont pas pu être chargées."}
            </span>
            <button
              type="button"
              onClick={retry}
              className="min-h-11 font-display text-meta font-extrabold text-vt-terracotta uppercase"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
