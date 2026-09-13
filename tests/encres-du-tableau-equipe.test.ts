import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Aucune encre du tableau « Membre par membre » ne passe sous 4,5:1.
 *
 * Le tableau a trois fonds superposés, et deux d'entre eux n'existent qu'au
 * survol : la carte est blanche, la ligne survolée se teinte en violet 50 à
 * 60%, et le lien survolé pose encore violet 100 à 70% par-dessus. Une encre
 * réglée sur le blanc peut donc être conforme au repos et fautive sous le
 * curseur, sans que rien ne le signale.
 *
 * C'est le cas de l'encre douce du système, qui vaut 4,74:1 sur le blanc mais
 * 4,49:1 sur la ligne survolée et 4,15:1 sur le lien survolé. Le test la
 * rattraperait si elle revenait.
 *
 * Les contrastes ne sont pas recopiés ici : ils sont recalculés depuis les
 * classes réellement écrites dans les deux fichiers lus, sur les fonds
 * réellement composés.
 *
 * Ce que ce test ne voit pas, et qu'il ne prétend donc pas garder : les encres
 * posées par les composants appelés depuis les cellules, qui vivent dans
 * d'autres fichiers. Elles ont été mesurées à part, dans le navigateur, où
 * aucune ne descend sous le seuil.
 *
 * Le thème clair est le seul mesuré, c'est le seul optimisé.
 */
const RACINE = path.resolve(__dirname, "..");

function source(relatif: string): string {
  return readFileSync(path.join(RACINE, relatif), "utf8");
}

const SECTION = "components/organisms/mon-equipe-section.tsx";
const CELLULE_RANG = "components/molecules/team-rank-cell.tsx";
const SEUIL_PETIT_TEXTE = 4.5;

/**
 * Les encres du thème clair employées par ce tableau, en valeur calculée.
 *
 * Une encre absente de cette table fait échouer le test plutôt que de passer
 * sans être mesurée : c'est ce qui empêche d'ajouter une couleur au tableau
 * sans en connaître le contraste.
 */
const ENCRES_CLAIRES: Record<string, string> = {
  "text-white": "#ffffff",
  "text-zinc-50": "#fafafa",
  "text-zinc-200": "#e4e4e7",
  "text-zinc-500": "#71717b",
  "text-zinc-600": "#52525c",
  "text-zinc-700": "#3f3f47",
  "text-zinc-800": "#27272a",
  "text-zinc-950": "#09090b",
  "text-violet-700": "#7008e7",
  "text-muted-foreground": "#737373",
};

type Couleur = readonly [number, number, number];

function versCanaux(hex: string): Couleur {
  const brut = hex.replace("#", "");
  return [0, 2, 4].map((i) =>
    parseInt(brut.slice(i, i + 2), 16),
  ) as unknown as Couleur;
}

/** Une couleur posée à `alpha` sur un fond donne la couleur que l'œil reçoit. */
function composer(dessus: Couleur, alpha: number, dessous: Couleur): Couleur {
  return dessus.map((canal, i) =>
    Math.round(canal * alpha + dessous[i]! * (1 - alpha)),
  ) as unknown as Couleur;
}

function luminance(couleur: Couleur): number {
  const [r, v, b] = couleur.map((canal) => {
    const c = canal / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as unknown as Couleur;
  return 0.2126 * r + 0.7152 * v + 0.0722 * b;
}

/** Le plus grand écart entre deux couleurs, canal par canal. */
function ecartMaximal(a: Couleur, b: Couleur): number {
  return Math.max(...a.map((canal, i) => Math.abs(canal - b[i]!)));
}

function contraste(encre: Couleur, fond: Couleur): number {
  const [clair, sombre] = [luminance(encre), luminance(fond)].sort(
    (a, b) => b - a,
  );
  return (clair! + 0.05) / (sombre! + 0.05);
}

const BLANC: Couleur = [255, 255, 255];
const VIOLET_50: Couleur = versCanaux("#f5f3ff");
const VIOLET_100: Couleur = versCanaux("#ede9fe");

/**
 * Les classes de survol lues dans la source plutôt que supposées : si l'une
 * change, ce sont les fonds calculés qui changent, et les contrastes avec eux.
 */
function alphaDeSurvol(texte: string, teinte: string): number {
  const trouve = texte.match(
    new RegExp(`(?<![\\w:-])hover:bg-${teinte}/(\\d+)`),
  );
  expect(trouve).not.toBeNull();
  return Number(trouve![1]) / 100;
}

function fonds(): { ligne: Couleur; lien: Couleur } {
  const texte = source(SECTION);
  const ligne = composer(VIOLET_50, alphaDeSurvol(texte, "violet-50"), BLANC);
  return {
    ligne,
    lien: composer(VIOLET_100, alphaDeSurvol(texte, "violet-100"), ligne),
  };
}

/**
 * Du bloc qui porte le tableau jusqu'à sa fermeture, puis, dedans, la portion
 * tenue par le lien vers la fiche : c'est elle qui reçoit le second fond.
 */
function zones(): { ligne: string; lien: string } {
  const fichier = source(SECTION);
  const debut = fichier.indexOf('<div className="@container');
  const tableau = fichier.slice(debut, fichier.indexOf("</table>", debut));
  const ouverture = tableau.indexOf("<Link");
  const fermeture = tableau.indexOf("</Link>", ouverture);

  expect(debut).toBeGreaterThan(-1);
  expect(ouverture).toBeGreaterThan(-1);

  return {
    ligne:
      tableau.slice(0, ouverture) +
      tableau.slice(fermeture) +
      source(CELLULE_RANG),
    lien: tableau.slice(ouverture, fermeture),
  };
}

/**
 * Les encres posées à même le fond de la zone, et elles seules.
 *
 * Toutes les chaînes de la zone sont lues, et non les seuls `className="…"` :
 * plusieurs classes se choisissent dans une condition, et une branche de
 * condition est une chaîne comme une autre. Une lecture plus étroite les
 * laisserait passer sans les mesurer.
 *
 * Une chaîne qui déclare aussi un fond est écartée : l'élément qui la porte
 * peint le sien et ne dépend pas de ce qu'il y a dessous. C'est le cas de la
 * pastille de rang, du badge de palier et de la pastille d'initiales, dont les
 * contrastes sont établis là où ils sont écrits. Les variantes sombres sont
 * ignorées, le thème sombre n'étant pas optimisé.
 */
/** Les utilitaires `text-` qui règlent la taille ou l'alignement, pas l'encre. */
const TEXTE_SANS_COULEUR =
  /^text-(?:xs|sm|base|lg|\d*xl|left|right|center|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip|\[.*\])$/;

function encresSurLeFond(zone: string): string[] {
  const chaines = [...zone.matchAll(/"([^"\n]*)"|`([^`]*)`/g)]
    .map((m) => m[1] ?? m[2] ?? "")
    .filter((valeur) => !/(?<![\w:-])bg-/.test(valeur));

  const encres = new Set<string>();
  for (const mot of chaines.join(" ").split(/\s+/)) {
    const variantes = mot.split(":");
    const utilitaire = variantes.pop() ?? "";
    if (variantes.includes("dark")) continue;
    if (!utilitaire.startsWith("text-")) continue;
    if (TEXTE_SANS_COULEUR.test(utilitaire)) continue;
    encres.add(utilitaire);
  }
  return [...encres].sort();
}

/**
 * Le verdict de chaque encre, nommée à côté du sien : une encre fautive se lit
 * alors dans le rapport d'échec, sans avoir à relancer quoi que ce soit.
 */
function verdicts(zone: string, fond: Couleur): string[] {
  return encresSurLeFond(zone).map((encre) => {
    const valeur = ENCRES_CLAIRES[encre];
    if (valeur === undefined) return `${encre} : encre inconnue, a mesurer`;
    const mesure = contraste(versCanaux(valeur), fond);
    return mesure >= SEUIL_PETIT_TEXTE
      ? "ok"
      : `${encre} : ${mesure.toFixed(2).replace(".", ",")}:1, sous le seuil`;
  });
}

const fautives = (rapport: string[]) => rapport.filter((v) => v !== "ok");

describe("les encres du tableau d'équipe tiennent sur les fonds de survol", () => {
  it("les deux fonds de survol sont ceux que le navigateur peint", () => {
    /*
      Les deux valeurs de référence ont été relevées au pixel dans Chromium,
      sur une capture prise pendant le survol, et non déduites d'un calcul.

      Le calcul mène au même endroit à un pas près : Tailwind déclare ses
      couleurs dans un espace perceptuel, où le navigateur les mélange, quand
      ce fichier les compose en sRGB. L'écart vaut 1 sur 255 dans le rouge du
      fond du lien, et il ne déplace aucun verdict : l'encre douce y vaut
      4,15:1 des deux façons. La tolérance dit cet écart plutôt que de le
      taire.

      Ce n'est pas ce test qui surveille les opacités : ce sont les trois
      suivants, par les contrastes qu'elles produisent.
    */
    const { ligne, lien } = fonds();

    expect(ecartMaximal(ligne, versCanaux("#f9f8ff"))).toBeLessThanOrEqual(1);
    expect(ecartMaximal(lien, versCanaux("#f0eefe"))).toBeLessThanOrEqual(1);
  });

  it("aucune encre de la ligne ne descend sous le seuil", () => {
    const rapport = verdicts(zones().ligne, fonds().ligne);

    expect(rapport.length).toBeGreaterThan(0);
    expect(fautives(rapport)).toEqual([]);
  });

  it("aucune encre du lien ne descend sous le seuil", () => {
    const rapport = verdicts(zones().lien, fonds().lien);

    expect(rapport.length).toBeGreaterThan(0);
    expect(fautives(rapport)).toEqual([]);
  });

  it("l'encre douce du système ne tiendrait ni sur l'une ni sur l'autre", () => {
    /*
      La raison d'être du test, écrite en clair : sans elle, on lirait les
      trois cas précédents comme une formalité toujours vraie.
    */
    const { ligne, lien } = fonds();
    const douce = versCanaux(ENCRES_CLAIRES["text-muted-foreground"]!);

    expect(contraste(douce, BLANC)).toBeGreaterThan(SEUIL_PETIT_TEXTE);
    expect(contraste(douce, ligne)).toBeLessThan(SEUIL_PETIT_TEXTE);
    expect(contraste(douce, lien)).toBeLessThan(SEUIL_PETIT_TEXTE);
  });
});
