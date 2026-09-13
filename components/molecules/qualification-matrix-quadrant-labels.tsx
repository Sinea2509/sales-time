"use client";

import { useDrawingArea } from "@mui/x-charts/hooks";
import {
  QUADRANTS_MATRICE,
  type CoinDeMatrice,
} from "@/src/core/domain/matrice-quadrants";

/** Distance au bord du repère, en pixels de dessin. */
const MARGE = 6;
const TAILLE_TEXTE = 11;

type Ancrage = {
  x: number;
  y: number;
  textAnchor: "start" | "end";
  dominantBaseline: "hanging" | "auto";
};

function ancrageDuCoin(
  coin: CoinDeMatrice,
  zone: { left: number; top: number; width: number; height: number },
): Ancrage {
  const gauche = zone.left + MARGE;
  const droite = zone.left + zone.width - MARGE;
  const haut = zone.top + MARGE;
  const bas = zone.top + zone.height - MARGE;

  switch (coin) {
    case "haut-gauche":
      return {
        x: gauche,
        y: haut,
        textAnchor: "start",
        dominantBaseline: "hanging",
      };
    case "haut-droite":
      return {
        x: droite,
        y: haut,
        textAnchor: "end",
        dominantBaseline: "hanging",
      };
    case "bas-gauche":
      return {
        x: gauche,
        y: bas,
        textAnchor: "start",
        dominantBaseline: "auto",
      };
    case "bas-droite":
      return { x: droite, y: bas, textAnchor: "end", dominantBaseline: "auto" };
  }
}

/**
 * Le nom de chaque quadrant, posé dans son coin du repère.
 *
 * Les coordonnées viennent de `useDrawingArea()`, c'est-à-dire de la zone de
 * dessin réelle une fois les marges et les axes retirés : des `div` posés en
 * absolu sur le conteneur se seraient décalés du repère dès que la largeur des
 * étiquettes d'axe change.
 *
 * `aria-hidden` : le même contenu est déjà lisible en texte, dans l'info-bulle
 * d'un point et dans la légende sous le graphique. Laisser ces quatre mots
 * dans l'ordre du SVG les ferait lire hors de tout contexte.
 */
export function QualificationMatrixQuadrantLabels() {
  const { left, top, width, height } = useDrawingArea();
  const zone = { left, top, width, height };

  return (
    <g aria-hidden pointerEvents="none">
      {QUADRANTS_MATRICE.map((quadrant) => {
        const ancrage = ancrageDuCoin(quadrant.coin, zone);
        return (
          <text
            key={quadrant.cle}
            x={ancrage.x}
            y={ancrage.y}
            textAnchor={ancrage.textAnchor}
            dominantBaseline={ancrage.dominantBaseline}
            fontSize={TAILLE_TEXTE}
            fontWeight={500}
            fill="var(--muted-foreground)"
          >
            {quadrant.action}
          </text>
        );
      })}
    </g>
  );
}
