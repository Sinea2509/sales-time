"use client";

import { useState, useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * Faut-il animer ce composant depuis zéro à son arrivée ?
 *
 * Non quand React reprend une page rendue par le serveur (hydratation) : le
 * chiffre est déjà affiché, le remettre à zéro ferait clignoter la page, et
 * le rendu ne correspondrait plus à celui du serveur. Oui quand le composant
 * naît dans le navigateur, à chaque navigation. Jamais pour qui a demandé
 * moins d'animations.
 *
 * Pendant l'hydratation, `useSyncExternalStore` lit l'instantané « serveur »
 * (false) ; à un montage dans le navigateur, l'instantané « client » (true).
 * La réponse est figée au premier rendu.
 */
export function useAnimateOnMount(): boolean {
  const mountedInBrowser = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const [animate] = useState(
    () =>
      mountedInBrowser &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  return animate;
}

/** Une courbe qui démarre vite et se pose en douceur. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
