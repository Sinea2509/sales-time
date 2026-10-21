"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatLeadingNumber, parseLeadingNumber } from "@/lib/leading-number";
import { easeOutCubic, useAnimateOnMount } from "@/lib/mount-animation";

const COUNT_UP_MS = 900;

/**
 * Un chiffre clé qui monte jusqu'à sa valeur quand la page arrive. Tout ce
 * qui n'est pas un texte commençant par un nombre s'affiche tel quel.
 */
export function AnimatedFigure({ children }: { children: ReactNode }) {
  const text =
    typeof children === "number"
      ? children.toLocaleString("fr-FR")
      : typeof children === "string"
        ? children
        : null;
  const parsed = text == null ? null : parseLeadingNumber(text);
  const animate = useAnimateOnMount() && parsed != null;
  const [progress, setProgress] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / COUNT_UP_MS);
      setProgress(easeOutCubic(t));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  if (parsed == null || progress >= 1) return <>{children}</>;
  const factor = 10 ** parsed.decimals;
  const value = Math.round(parsed.value * progress * factor) / factor;
  return (
    <span aria-label={text ?? undefined}>
      <span aria-hidden>{formatLeadingNumber(parsed, value)}</span>
    </span>
  );
}
