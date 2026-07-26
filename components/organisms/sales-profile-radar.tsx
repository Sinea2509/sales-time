"use client";

import { useEffect, useState } from "react";
import { RadarChart } from "@mui/x-charts/RadarChart";
import { ChartTheme } from "@/components/atoms/chart-theme";
import {
  SALES_PROFILE_DIMENSION_KEYS,
  type SalesProfileScores,
} from "@/src/core/domain/sales-profile-from-meetings";
import { SELLER_SKILL_SHORT_FR } from "@/src/core/domain/seller-skill-signature";

export type { SalesProfileScores };

/*
  Les six sommets et les six valeurs sortent de la même liste de clés, dans le
  même ordre, et c'est la raison d'être de cette page-ci.

  Ce fichier portait deux listes parallèles : six libellés écrits à la main
  d'un côté, six accès `scores.xxx` de l'autre. Rien ne les tenait ensemble.
  Ajouter une septième compétence, ou seulement en réordonner deux dans le
  domaine, aurait affiché des notes justes sous des noms faux, et le radar
  n'aurait pas eu l'air cassé pour autant. Deux de ces libellés étaient
  d'ailleurs faux avant même cela : « Sympathie » est un levier SONCAS, qui
  décrit le prospect, et « Next steps » n'était pas français.
*/
const METRICS = SALES_PROFILE_DIMENSION_KEYS.map((key) => ({
  name: SELLER_SKILL_SHORT_FR[key],
  min: 0,
  max: 100,
}));

const CURRENT_SERIES_ID = "current-profile";
const PREVIOUS_SERIES_ID = "previous-profile";

/*
  Les deux couleurs sont déclarées ici et nulle part ailleurs : le graphique
  et la légende lisent la même constante, donc la légende ne peut plus
  décrire un trait que le radar ne dessine pas.

  Le profil précédent n'est pas une catégorie de plus, c'est le repère contre
  lequel se lit le profil actuel : il porte donc l'encre de chrome du thème,
  comme les axes. Elle était écrite en dur (« #94a3b8 ») ; sur une carte
  claire ce gris ne tenait que 2,56:1, là où un trait porteur de sens demande
  3:1. Le jeton tient 4,74:1 en clair et 6,94:1 en sombre, et suivra une
  organisation qui personnalisera ses couleurs.
*/
const CURRENT_SERIES_COLOR = "#8b5cf6";
const PREVIOUS_SERIES_COLOR = "var(--chart-ink)";

function scoresToData(scores: SalesProfileScores): number[] {
  return SALES_PROFILE_DIMENSION_KEYS.map((key) => scores[key]);
}

export function SalesProfileRadar({
  scores,
  previousScores = null,
  height,
}: {
  scores: SalesProfileScores;
  previousScores?: SalesProfileScores | null;
  height?: number;
}) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const chartHeight = height ?? (isCompact ? 300 : 340);
  const margin = isCompact
    ? { top: 32, right: 52, bottom: 32, left: 52 }
    : { top: 28, right: 44, bottom: 28, left: 44 };
  const series = [
    {
      id: CURRENT_SERIES_ID,
      label: "Profil actuel",
      data: scoresToData(scores),
      fillArea: true,
      color: CURRENT_SERIES_COLOR,
    },
    ...(previousScores
      ? [
          {
            id: PREVIOUS_SERIES_ID,
            label: "Profil précédent",
            data: scoresToData(previousScores),
            fillArea: false,
            hideMark: true,
            color: PREVIOUS_SERIES_COLOR,
          },
        ]
      : []),
  ];

  return (
    <div className="w-full space-y-3">
      <ChartTheme>
        <RadarChart
          height={chartHeight}
          series={series}
          radar={{ metrics: METRICS }}
          shape="circular"
          divisions={4}
          hideLegend
          margin={margin}
          /*
            Deux règles vivaient ici, et aucune des deux n'atteignait quoi que
            ce soit. La première fixait la taille des libellés via
            « .MuiChartsAxis-tickLabel » : un radar ne dessine aucun axe
            cartésien, et cette classe n'existe nulle part dans son SVG. Elle
            est supprimée, les six libellés sont ceux de MUI.

            La seconde traçait en tirets le profil précédent via
            « [data-series='previous-profile'] », un sélecteur copié d'un nuage
            de points. Vérifié au navigateur : seuls ScatterChart et BarChart
            posent « data-series » ; le radar ne le pose sur rien et ne
            distingue pas ses deux séries par une classe. Le trait était donc
            plein alors que la légende le montrait tireté.

            MUI remplit l'aire d'une série non remplie avec « transparent »
            (RadarSeriesArea.js, getPathProps) : c'est le seul attribut qui
            sépare les deux tracés. Le tireté compte, car il se lit aussi en
            noir et blanc et en vision des couleurs déficiente, là où deux gris
            ne se distinguent pas. Si MUI change cet attribut, le trait
            redevient plein, ce qui reste lisible.
          */
          sx={
            previousScores
              ? {
                  '& .MuiRadarChart-seriesArea[fill="transparent"]': {
                    strokeDasharray: "6 4",
                    strokeWidth: 2,
                  },
                }
              : undefined
          }
        />
      </ChartTheme>
      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-8 rounded-full"
            style={{ backgroundColor: CURRENT_SERIES_COLOR }}
            aria-hidden
          />
          Profil actuel
        </span>
        {previousScores ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-0 w-8 border-t-2 border-dashed"
              style={{ borderColor: PREVIOUS_SERIES_COLOR }}
              aria-hidden
            />
            Profil précédent
          </span>
        ) : null}
      </div>
    </div>
  );
}
