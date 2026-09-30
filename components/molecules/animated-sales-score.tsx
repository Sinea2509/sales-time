"use client";

import { useEffect, useRef, useState } from "react";
import { salesScoreColorClass } from "@/lib/sales-score-color";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";

const COUNT_UP_MS = 1_400;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Le SalesScore d'un rendez-vous, qui monte de zéro jusqu'à sa valeur quand
 * l'analyse SONCAS arrive, et change de couleur en passant les paliers.
 *
 * Une fiche ouverte avec son score déjà connu l'affiche tel quel : le
 * mouvement raconte l'arrivée d'un résultat, pas le chargement d'une page.
 * Tant que le score n'existe pas, trois points animés disent que le calcul
 * est en route ; « n. c. » reste réservé au cas où il n'y aura pas de score.
 */
export function AnimatedSalesScore({
  score,
  pending,
  className,
}: {
  score: number | null;
  /** Vrai pendant l'analyse automatique : le score va arriver. */
  pending: boolean;
  className?: string;
}) {
  /*
    La cible est gardée avec la valeur affichée : entre l'arrivée d'un nouveau
    score et la première image de son animation, le rendu sait que la valeur
    en mémoire décrit l'ancienne cible et repart de zéro.
  */
  const [shown, setShown] = useState<{
    target: number | null;
    value: number | null;
  }>({ target: score, value: score });
  const lastTargetRef = useRef<number | null>(score);

  useEffect(() => {
    const from = lastTargetRef.current;
    lastTargetRef.current = score;
    if (score == null || from === score) return;

    const start = from ?? 0;
    const reduce = prefersReducedMotion();
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - startedAt) / COUNT_UP_MS);
      setShown({
        target: score,
        value: Math.round(start + (score - start) * easeOutCubic(t)),
      });
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [score]);

  if (score == null) {
    if (!pending) {
      return <span className={className}>{VALEUR_NON_CALCULABLE}</span>;
    }
    return (
      <span
        className={cn("text-brand inline-flex items-end gap-1 pb-2", className)}
        role="status"
        aria-label="SalesScore en cours de calcul"
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden
            className="bg-brand size-1.5 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    );
  }

  const value = shown.target === score ? (shown.value ?? 0) : 0;
  return (
    <span
      className={cn(
        "transition-colors duration-300",
        salesScoreColorClass(value),
        className,
      )}
      aria-label={`SalesScore ${score} sur 100`}
    >
      {value}
    </span>
  );
}
