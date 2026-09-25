"use client";

// Compte à rebours du prochain match (T019b, FR-025, research.md §16).
// Le HTML serveur ne contient que des tirets : le décompte n'est calculé qu'après montage,
// sans écart d'hydratation. Sous prefers-reduced-motion : mise à jour à la minute, sans
// secondes. Pas d'aria-live : la date en clair (<time>) porte l'information.
import { useEffect, useState, useSyncExternalStore } from "react";
import { timeRemaining, type TimeRemaining } from "@/lib/next-competition";

const pad = (n: number) => String(n).padStart(2, "0");

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const tick = () => setRemaining(timeRemaining(target));
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, reducedMotion ? 60_000 : 1_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [target, reducedMotion]);

  const units = [
    { label: "Jours", value: remaining?.days },
    { label: "Heures", value: remaining?.hours },
    { label: "Minutes", value: remaining?.minutes },
    ...(reducedMotion ? [] : [{ label: "Secondes", value: remaining?.seconds }]),
  ];

  return (
    <dl
      aria-label="Temps restant avant le match"
      className={`grid grid-cols-2 gap-y-4 border-t border-vt-cream/15 pt-5 text-center ${
        reducedMotion ? "sm:grid-cols-3" : "sm:grid-cols-4"
      }`}
    >
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col-reverse gap-1">
          <dt className="text-[0.6875rem] tracking-[0.12em] text-vt-text-on-dark-muted uppercase">
            {unit.label}
          </dt>
          <dd className="font-display text-[2.625rem] leading-none font-extrabold text-vt-yellow tabular-nums">
            {unit.value === undefined ? "––" : pad(unit.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
