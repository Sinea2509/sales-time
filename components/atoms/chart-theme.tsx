"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import type {} from "@mui/x-charts/themeAugmentation";
import type { ReactNode } from "react";

/*
  Tout ce qui n'est pas une donnée dans un graphique (axes, graduations,
  grille, toile du radar, info-bulle) est peint par MUI à partir de SON thème,
  pas du nôtre. L'application n'installait aucun thème MUI, donc chaque
  graphique retombait sur le thème clair par défaut de la bibliothèque, dans
  les deux modes. Mesuré au navigateur sur la surface réelle d'une carte :

  - étiquettes de graduation et titres d'axe : 16,10:1 en clair, 1,15:1 en
    sombre. Un texte a besoin de 4,5:1 ; à 1,15:1 les chiffres des axes
    étaient tout simplement invisibles.
  - lignes d'axe et graduations : mêmes valeurs, alors qu'un trait porteur de
    sens demande 3:1.
  - grille : 1,32:1 en clair, 1,03:1 en sombre.
  - libellés du radar : 16,10:1 en clair, 1,15:1 en sombre.
  - info-bulle des graphiques à barres et du radar : fond blanc et texte noir,
    y compris en thème sombre.
  - toute la typographie des graphiques : « Roboto, Helvetica, Arial », alors
    que le reste de l'application écrit en Geist.

  En clair le défaut est l'inverse et tout aussi réel : à 16,10:1 le chrome
  est plus noir que le texte courant, donc il concurrence les données au lieu
  de les porter.

  Plutôt que de repeindre chaque classe CSS à la main dans chaque graphique,
  on donne à MUI le seul thème dont il manquait. Ses valeurs ne sont pas des
  couleurs mais les jetons `--chart-*` de `globals.css`, qui pointent eux-mêmes
  vers l'encre et la bordure du thème : le chrome suit donc le mode clair ou
  sombre sans qu'on ait rien à dupliquer, et suivra aussi une organisation qui
  personnalisera ses couleurs.
*/
const THEME_DES_GRAPHIQUES = createTheme({
  /*
    MUI écrit sa police dans l'attribut `style` de chaque texte, où aucune
    feuille de style ne peut l'atteindre. `inherit` la fait dépendre du
    conteneur, donc de la police de l'application, quelle qu'elle devienne.
  */
  typography: { fontFamily: "inherit" },
  shape: { borderRadius: 8 },
  palette: {
    text: {
      primary: "var(--chart-ink)",
      secondary: "var(--chart-ink)",
    },
    divider: "var(--chart-grid)",
    background: { paper: "var(--popover)" },
  },
  components: {
    /*
      Les axes partagent par défaut la couleur du texte des étiquettes. Un
      trait n'a pas besoin d'être aussi présent qu'un chiffre : il encadre la
      lecture, il ne se lit pas. D'où un jeton plus discret pour les traits.

      Mesuré, ce cadre tient 1,69:1 en clair et 2,15:1 en sombre, donc sous le
      seuil de 3:1. Ce seuil vaut pour un trait qui porte une donnée, comme les
      lignes de repère de la matrice, qui tiennent 4,74:1 et 6,94:1. Le cadre
      d'un graphique n'en porte aucune : il se range entre la grille (1,26:1 et
      1,34:1) et ces lignes de repère, assez visible pour délimiter la zone de
      tracé, trop discret pour se disputer l'attention avec les points. Ces
      trois niveaux ont été comparés à l'écran dans les deux modes. Le monter
      à 3:1 ferait du cadre l'élément le plus contrasté du graphique après les
      données elles-mêmes.
    */
    MuiChartsAxis: {
      styleOverrides: {
        root: {
          "& .MuiChartsAxis-line": { stroke: "var(--chart-axis)" },
          "& .MuiChartsAxis-tick": { stroke: "var(--chart-axis)" },
        },
      },
    },
    /*
      L'info-bulle est une surface, pas un graphique : son fond vient de
      `background.paper` ci-dessus. Restent deux choses que la palette ne sait
      pas dire.

      La bordure d'abord. MUI la prend dans `divider`, que la grille prend
      aussi ; les deux valent le même jeton aujourd'hui, mais une grille a
      vocation à s'effacer et une bordure d'info-bulle à tenir. On l'écrit donc
      à part, pour que rendre la grille plus discrète n'efface pas l'info-bulle
      au passage.

      Le texte ensuite. MUI peint la valeur avec `text.primary`, le même jeton
      que les étiquettes d'axe, qui doivent rester pâles. La valeur d'une
      info-bulle est au contraire ce qu'on est venu lire : elle prend l'encre
      des surfaces flottantes, et seul le nom de la série reste pâle.

      Les sélecteurs passent par « paper » exprès. La règle de MUI sur ces
      cellules vaut deux classes ; à spécificité égale c'est l'ordre
      d'insertion qui tranche, et il ne nous est pas favorable. Vérifié au
      navigateur : sans ce niveau de plus, la valeur restait à `text.primary`.
    */
    MuiChartsTooltip: {
      styleOverrides: {
        root: {
          "& .MuiChartsTooltip-paper": {
            color: "var(--popover-foreground)",
            borderColor: "var(--border)",
          },
          "& .MuiChartsTooltip-paper .MuiChartsTooltip-labelCell": {
            color: "var(--muted-foreground)",
          },
          "& .MuiChartsTooltip-paper .MuiChartsTooltip-valueCell": {
            color: "var(--popover-foreground)",
          },
          "& .MuiChartsTooltip-paper .MuiChartsTooltip-axisValueCell": {
            color: "var(--popover-foreground)",
          },
        },
      },
    },
  },
});

/**
 * À poser autour de tout graphique MUI.
 *
 * Le composant ne dessine rien : il fournit le thème que MUI consulte pour
 * peindre son chrome. `tests/graphiques-themes.test.ts` vérifie qu'aucun
 * graphique ne s'en passe.
 */
export function ChartTheme({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={THEME_DES_GRAPHIQUES}>{children}</ThemeProvider>;
}
