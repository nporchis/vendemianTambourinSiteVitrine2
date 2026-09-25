"use client";

// Sentinelle du défilement infini (T034a, FR-018) : dès qu'elle approche du viewport,
// demande la page suivante — aucun clic. Rien n'est observé quand il n'y a plus de page.
import { useEffect, useRef } from "react";

type InfiniteScrollTriggerProps = {
  /** false quand `nextCursor` est null ou qu'un chargement est en cours. */
  enabled: boolean;
  onTrigger: () => void;
  /** Change à chaque page reçue : ré-observe si la sentinelle est toujours visible. */
  itemCount: number;
};

export function InfiniteScrollTrigger({
  enabled,
  onTrigger,
  itemCount,
}: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    const sentinel = ref.current;
    if (!enabled || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          onTriggerRef.current();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, itemCount]);

  return <div ref={ref} aria-hidden="true" className="h-px" data-testid="gallery-sentinel" />;
}
