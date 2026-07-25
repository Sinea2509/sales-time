"use client";

import type { ReactNode } from "react";
import {
  ID_CHAMP_FORFAIT_SOUHAITE,
  ID_FORMULAIRE_DEMANDE,
  type ForfaitPropose,
} from "@/lib/demande-de-forfait";

/**
 * Bouton d'une carte de forfait. Il descend au formulaire de demande, en bas de
 * la même page, avec le forfait déjà choisi.
 *
 * C'est une ancre et non un bouton : la descente marche alors sans JavaScript,
 * et la présélection vient en plus quand le script tourne. Le `<select>` visé
 * n'est pas contrôlé par React (il n'a qu'un `defaultValue`, et le formulaire
 * lit la valeur au moment de l'envoi), donc écrire `value` suffit : aucun
 * événement à émettre, personne ne l'écoute.
 */
export function PlanChoiceLink({
  forfait,
  className,
  children,
}: {
  forfait: ForfaitPropose;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`#${ID_FORMULAIRE_DEMANDE}`}
      className={className}
      onClick={() => {
        const champ = document.getElementById(ID_CHAMP_FORFAIT_SOUHAITE);
        if (!(champ instanceof HTMLSelectElement)) return;
        champ.value = forfait;
        /*
          Le focus part à l'image suivante, et non tout de suite : le navigateur
          replace lui-même le focus après avoir suivi l'ancre, si bien qu'un
          appel synchrone était défait dans la foulée. Mesuré au navigateur :
          sans ce report, `document.activeElement` retombait sur `body`.

          `preventScroll` parce que l'ancre a déjà fait défiler la page, et que
          deux défilements concurrents la feraient sursauter. Le focus sert
          surtout aux lecteurs d'écran, à qui il annonce « Forfait souhaité,
          Starter » : sans lui, la présélection leur resterait invisible.
        */
        requestAnimationFrame(() => champ.focus({ preventScroll: true }));
      }}
    >
      {children}
      {/*
        Les deux premières cartes portent le même libellé, « Choisir ce plan » :
        la liste des liens de la page contenait deux entrées indiscernables. Le
        nom accessible commence toujours par le texte visible, pour rester
        prononçable par la commande vocale.
      */}
      <span className="sr-only"> : forfait {forfait}</span>
    </a>
  );
}
