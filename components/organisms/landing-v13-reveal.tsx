"use client";

import { useEffect } from "react";

/**
 * Fait monter en fondu les blocs `data-reveal` de la landing v13 quand ils
 * entrent à l'écran, comme dans la maquette. Ceux déjà visibles au chargement
 * ne bougent pas.
 */
export function LandingV13Reveal() {
  useEffect(() => {
    const els = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ].filter((e) => e.getBoundingClientRect().top > window.innerHeight);
    for (const e of els) {
      e.style.opacity = "0";
      e.style.transform = "translateY(40px)";
      e.style.transition =
        "opacity 0.9s cubic-bezier(.2,.7,.2,1), transform 0.9s cubic-bezier(.2,.7,.2,1)";
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const t = en.target as HTMLElement;
          t.style.opacity = "1";
          t.style.transform = "none";
          io.unobserve(t);
          setTimeout(() => {
            t.style.transform = "";
            t.style.transition = "";
          }, 950);
        }
      },
      { threshold: 0.12 },
    );
    for (const e of els) io.observe(e);
    return () => io.disconnect();
  }, []);
  return null;
}
