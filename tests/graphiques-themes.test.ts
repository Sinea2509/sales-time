import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Un graphique MUI ne peint pas son chrome avec nos jetons : axes, grille,
 * info-bulle et police viennent de SON thème. Sans thème installé, il retombe
 * sur le thème clair par défaut de la bibliothèque, dans les deux modes. En
 * sombre, les étiquettes d'axe tombent alors à 1,15:1, c'est-à-dire
 * illisibles, et toute la typographie repasse en Roboto.
 *
 * Le défaut ne se voit pas à la relecture d'un diff, et pas non plus sur une
 * capture en mode clair : le graphique s'affiche, il est seulement mal peint.
 * D'où ce test, qui garde ce qu'une relecture ne gardera pas.
 */
const RACINE = path.resolve(__dirname, "..");

const MODULE_MUI = "@mui/x-charts";
const IMPORT_THEME = "@/components/atoms/chart-theme";

/**
 * Les racines de MUI dont le nom ne finit pas par « Chart ».
 *
 * La règle générale ci-dessous en attrape la majorité (BarChart, LineChart,
 * PieChart, ScatterChart, RadarChart, SparkLineChart, FunnelChart) sans avoir
 * à les énumérer, donc sans vieillir à la prochaine version de la
 * bibliothèque. Ces quatre-là échappent au motif et s'écrivent à la main.
 */
const RACINES_HORS_MOTIF = new Set([
  "Gauge",
  "Heatmap",
  "ChartContainer",
  "ChartDataProvider",
]);

/**
 * Distingue une racine de graphique d'un composant qui ne vit qu'à
 * l'intérieur d'un graphique.
 *
 * MUI préfixe ces derniers par « Charts » au pluriel : ChartsReferenceLine,
 * ChartsTooltipContainer, ChartsGrid, ChartsXAxis. Ils héritent du thème par
 * le graphique qui les contient, donc les envelopper à leur tour ne servirait
 * à rien. C'est le cas de nos deux molécules de matrice.
 */
function estUneRacine(nomImporte: string): boolean {
  if (RACINES_HORS_MOTIF.has(nomImporte)) return true;
  return nomImporte.endsWith("Chart") && !nomImporte.startsWith("Charts");
}

type Graphique = { fichier: string; source: string; racines: string[] };

/**
 * Seuls les .tsx peuvent contenir du JSX, et un fichier de test qui cite ces
 * noms ne dessine rien.
 */
function fichiersDeVue(): string[] {
  return execFileSync("git", ["ls-files", "-z", "*.tsx"], {
    cwd: RACINE,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean)
    .filter((rel) => !rel.endsWith(".test.tsx"));
}

/** Le nom local, celui qu'on lira dans le JSX, quel que soit l'alias. */
function racinesDuFichier(source: string): string[] {
  const motif = new RegExp(
    `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s+from\\s+"${MODULE_MUI}[^"]*"`,
    "g",
  );
  const locales: string[] = [];
  for (const [, liste] of source.matchAll(motif)) {
    for (const brut of liste.split(",")) {
      const [origine, alias] = brut.trim().split(/\s+as\s+/);
      if (!origine) continue;
      if (estUneRacine(origine)) locales.push(alias ?? origine);
    }
  }
  return locales;
}

function graphiquesDuDepot(): Graphique[] {
  const trouves: Graphique[] = [];
  for (const fichier of fichiersDeVue()) {
    const source = readFileSync(path.join(RACINE, fichier), "utf8");
    const racines = racinesDuFichier(source);
    if (racines.length > 0) trouves.push({ fichier, source, racines });
  }
  return trouves;
}

/**
 * Vrai si une balise `<ChartTheme>` est ouverte et pas encore refermée à cet
 * endroit du fichier. Le JSX étant forcément bien imbriqué, compter les
 * ouvertures et les fermetures qui précèdent suffit : importer le composant
 * sans l'utiliser, ou l'utiliser ailleurs dans le fichier, ne trompe pas ce
 * décompte.
 */
function estSousLeTheme(source: string, position: number): boolean {
  const avant = source.slice(0, position);
  const ouvertures = avant.match(/<ChartTheme[\s>]/g)?.length ?? 0;
  const fermetures = avant.match(/<\/ChartTheme>/g)?.length ?? 0;
  return ouvertures > fermetures;
}

function graphiquesSansTheme(): string[] {
  const nus: string[] = [];
  for (const { fichier, source, racines } of graphiquesDuDepot()) {
    if (!source.includes(IMPORT_THEME)) {
      nus.push(`${fichier} : n'importe pas ${IMPORT_THEME}`);
      continue;
    }
    for (const racine of racines) {
      const balise = new RegExp(`<${racine}[\\s/>]`, "g");
      for (const rendu of source.matchAll(balise)) {
        if (rendu.index != null && !estSousLeTheme(source, rendu.index)) {
          nus.push(`${fichier} : <${racine}> hors de <ChartTheme>`);
        }
      }
    }
  }
  return nus;
}

describe("themes des graphiques", () => {
  it("trouve les graphiques du dépôt, sinon un test vert ne prouverait rien", () => {
    // Quatre aujourd'hui : la matrice, le radar de profil et les deux
    // histogrammes du back-office. Le plancher attrape une détection muette,
    // pas un cinquième graphique, qui sera vérifié sans rien changer ici.
    expect(graphiquesDuDepot().length).toBeGreaterThanOrEqual(4);
  });

  it("pose chaque graphique sous le thème des graphiques", () => {
    expect(graphiquesSansTheme()).toEqual([]);
  });
});
