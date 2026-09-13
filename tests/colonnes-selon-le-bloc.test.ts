import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Le tableau « Membre par membre » se règle sur son bloc, jamais sur la fenêtre.
 *
 * Les deux ne varient pas ensemble. Le menu latéral s'ouvre à 768px de fenêtre
 * et prend 256px : en passant de 767 à 768px, la place disponible dans le bloc
 * tombe de 717px à 462px. La fenêtre grandit d'un pixel, le tableau en perd 255.
 * Réglé sur la fenêtre, il ajoutait justement une colonne à cet endroit, et
 * poussait 575px de contenu dans 462px de place : six noms sur sept coupés.
 *
 * D'où la règle que ce fichier garde : dans ce tableau, aucune variante ne se
 * lit sur la fenêtre. Tout se lit sur le bloc.
 *
 * Le test lit les sources : la suite tourne en environnement Node, sans DOM, et
 * la mise en page n'est donc pas observable ici autrement.
 */
const RACINE = path.resolve(__dirname, "..");

function source(relatif: string): string {
  return readFileSync(path.join(RACINE, relatif), "utf8");
}

const SECTION = "components/organisms/mon-equipe-section.tsx";
const CELLULE_RANG = "components/molecules/team-rank-cell.tsx";

/**
 * Du bloc qui porte le tableau jusqu'à sa fermeture. C'est la zone où la règle
 * s'applique ; au-dehors, sur l'en-tête de carte et la pagination, les
 * variantes de fenêtre restent justes puisque ces blocs-là occupent la largeur
 * qu'on leur donne sans avoir à compter leurs colonnes.
 */
function zoneDuTableau(): string {
  const fichier = source(SECTION);
  const debut = fichier.indexOf('<div className="@container');
  const fin = fichier.indexOf("</table>", debut);

  expect(debut).toBeGreaterThan(-1);
  expect(fin).toBeGreaterThan(debut);

  return fichier.slice(debut, fin);
}

/** Les préfixes de Tailwind qui se lisent sur la fenêtre, et eux seuls. */
const POINTS_DE_RUPTURE = /[\s"'`](?:sm|md|lg|xl|2xl):/g;

function seuils(texte: string, suffixe: string): number[] {
  const trouves = texte.matchAll(
    new RegExp(`@min-\\[(\\d+)px\\]:${suffixe}`, "g"),
  );
  return [...new Set([...trouves].map((m) => Number(m[1])))].sort(
    (a, b) => a - b,
  );
}

function fichiersSources(dossier: string, liste: string[] = []): string[] {
  for (const nom of readdirSync(path.join(RACINE, dossier))) {
    const relatif = path.join(dossier, nom);
    if (statSync(path.join(RACINE, relatif)).isDirectory()) {
      fichiersSources(relatif, liste);
    } else if (relatif.endsWith(".tsx") || relatif.endsWith(".ts")) {
      liste.push(relatif);
    }
  }
  return liste;
}

describe("le tableau d'équipe se règle sur son bloc", () => {
  it("le tableau déclare un bloc de référence", () => {
    /*
      Sans lui, les variantes « @min-[…] » ne s'appliquent jamais : le tableau
      resterait à trois colonnes sur un écran de 1440px sans que rien ne le
      signale, puisque l'absence de bloc de référence ne produit pas d'erreur.
    */
    expect(zoneDuTableau()).toContain('className="@container');
  });

  it("aucune variante de fenêtre ne subsiste dans le tableau", () => {
    const variantes = zoneDuTableau().match(POINTS_DE_RUPTURE) ?? [];

    expect(variantes.map((v) => v.trim())).toEqual([]);
  });

  it("la cellule de rang se lit sur le bloc, elle aussi", () => {
    /*
      Elle a son propre écart à masquer, et elle le masquait sur la fenêtre :
      l'écart revenait à 640px et portait la colonne « Rang » de 64 à 92px, y
      compris à 768px où le menu latéral venait de prendre 256px.
    */
    const cellule = source(CELLULE_RANG);
    const variantes = cellule.match(POINTS_DE_RUPTURE) ?? [];

    expect(variantes.map((v) => v.trim())).toEqual([]);
    expect(cellule).toContain("@min-[");
  });

  it("la cellule de rang ne sert qu'à ce tableau", () => {
    /*
      C'est ce qui autorise ses variantes de bloc : elle a toujours le
      « @container » du tableau au-dessus d'elle. Ailleurs, elles ne
      s'appliqueraient pas et l'écart disparaîtrait sans retour.
    */
    const appelants = ["app", "components", "src"]
      .flatMap((dossier) => fichiersSources(dossier))
      .filter(
        (fichier) =>
          fichier !== CELLULE_RANG && source(fichier).includes("TeamRankCell"),
      );

    expect(appelants).toEqual([SECTION]);
  });

  it("les largeurs minimales changent aux mêmes seuils que les colonnes", () => {
    /*
      Chaque largeur minimale est le garde-fou d'un régime de colonnes : elle
      doit donc monter là où une colonne apparaît, et nulle part ailleurs. Un
      seuil en trop ferait défiler un tableau qui tient ; un seuil en moins
      laisserait un régime sans garde-fou.
    */
    const zone = zoneDuTableau();
    const baliseTableau = zone.slice(zone.indexOf("<table"));

    expect(
      seuils(baliseTableau.slice(0, baliseTableau.indexOf(">")), "min-w-"),
    ).toEqual(seuils(zone, "table-cell"));
  });
});
