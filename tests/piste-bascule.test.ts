import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * La piste de répartition porte un empilement par régime et n'en dessine qu'un.
 *
 * Lequel dépend d'une requête de conteneur, donc d'une largeur écrite dans une
 * classe utilitaire. Cette largeur ne peut pas être construite à l'exécution :
 * le compilateur de feuilles de style lit les sources et ne produit une règle
 * que pour les classes qu'il y voit littéralement. Chaque largeur est donc
 * écrite deux fois, une fois en TypeScript pour le calcul des strates, une fois
 * en texte pour le dessin. Les noms des propriétés personnalisées le sont
 * aussi, une fois pour être posées sur la pastille et une fois pour être lues
 * par la classe.
 *
 * Le jour où l'une des écritures bouge sans l'autre, rien ne casse et rien ne
 * s'affiche de travers tout de suite : la piste garde simplement l'empilement
 * d'un régime plus étroit jusqu'à une largeur, puis passe à un empilement
 * calculé pour une autre, et deux pastilles finissent par se recouvrir sans que
 * personne ne l'ait demandé. Un diff ne montre pas ce désaccord, une capture
 * non plus tant qu'on ne tombe pas sur la bonne largeur. D'où ce test.
 */
const FICHIER = path.resolve(
  __dirname,
  "../components/organisms/team-collective-overview.tsx",
);

const source = readFileSync(FICHIER, "utf8");

type RegimeLu = {
  readonly largeurPx: number;
  readonly variableHauteur: string;
  readonly variableBas: string;
  readonly classeHauteur: string;
  readonly classeBas: string;
};

function champ(entree: string, nom: string): string {
  const trouve = entree.match(new RegExp(`${nom}:\\s*"([^"]+)"`));
  if (trouve == null) {
    throw new Error(`« ${nom} » manque dans un régime de ${nomDuFichier()}.`);
  }
  return trouve[1]!;
}

function nomDuFichier(): string {
  return path.basename(FICHIER);
}

/** Les régimes tels qu'ils sont écrits dans le fichier, pas tels qu'exportés. */
function lireLesRegimes(): RegimeLu[] {
  const bloc = source.match(
    /const REGIMES_DE_PISTE = \[([\s\S]*?)\n\] as const;/,
  );
  if (bloc == null) {
    throw new Error(`« REGIMES_DE_PISTE » a disparu de ${nomDuFichier()}.`);
  }
  return [...bloc[1]!.matchAll(/\{([\s\S]*?)\}/g)].map((entree) => {
    const texte = entree[1]!;
    const largeur = texte.match(/largeurPx:\s*(\d+)/);
    if (largeur == null) {
      throw new Error(
        `« largeurPx » manque dans un régime de ${nomDuFichier()}.`,
      );
    }
    return {
      largeurPx: Number(largeur[1]),
      variableHauteur: champ(texte, "variableHauteur"),
      variableBas: champ(texte, "variableBas"),
      classeHauteur: champ(texte, "classeHauteur"),
      classeBas: champ(texte, "classeBas"),
    };
  });
}

describe("les régimes de la piste de répartition", () => {
  const regimes = lireLesRegimes();

  it("en pose au moins deux, du plus étroit au plus large", () => {
    /*
      Un seul régime, ce serait l'empilement du téléphone appliqué à un écran
      de bureau : l'escalier que toute cette mécanique existe pour éviter.
    */
    expect(regimes.length).toBeGreaterThanOrEqual(2);
    const largeurs = regimes.map((regime) => regime.largeurPx);
    expect(largeurs).toEqual([...largeurs].sort((a, b) => a - b));
    expect(new Set(largeurs).size).toBe(largeurs.length);
  });

  it("dessine le premier régime sans condition de largeur", () => {
    /*
      C'est le plancher : il tient sur le plus petit téléphone visé, et rien
      en dessous de lui ne doit pouvoir le désactiver.
    */
    const plancher = regimes[0]!;
    expect(plancher.classeHauteur).toBe(`h-[var(${plancher.variableHauteur})]`);
    expect(plancher.classeBas).toBe(`bottom-[var(${plancher.variableBas})]`);
  });

  it("écrit la même largeur dans le nombre et dans les classes", () => {
    for (const regime of regimes.slice(1)) {
      const condition = `@min-[${regime.largeurPx}px]:`;
      expect(regime.classeHauteur).toBe(
        `${condition}h-[var(${regime.variableHauteur})]`,
      );
      expect(regime.classeBas).toBe(
        `${condition}bottom-[var(${regime.variableBas})]`,
      );
    }
  });

  it("donne à chaque régime ses propres propriétés personnalisées", () => {
    /*
      Deux régimes qui partagent une variable, c'est le second qui écrase le
      premier sur toutes les largeurs à la fois.
    */
    const noms = regimes.flatMap((regime) => [
      regime.variableHauteur,
      regime.variableBas,
    ]);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it("ne mentionne aucune largeur de bascule en dehors des régimes", () => {
    /*
      Une classe oubliée derrière un ancien seuil, ou une prose qui annonce une
      bascule que le code ne pratique plus, sont le même mensonge : la largeur
      lue dans le fichier ne serait plus celle qui s'applique.
    */
    const largeursDuTexte = [...source.matchAll(/@min-\[(\d+)px\]/g)].map((m) =>
      Number(m[1]),
    );
    const attendues = regimes.slice(1).map((regime) => regime.largeurPx);

    expect(largeursDuTexte.length).toBeGreaterThan(0);
    expect([...new Set(largeursDuTexte)].sort((a, b) => a - b)).toEqual(
      attendues,
    );
  });

  it("réserve à la piste la largeur de son plancher", () => {
    /*
      Le plancher sert à deux choses qui doivent rester la même : il porte
      l'empilement le plus serré, et il donne à la piste la largeur en dessous
      de laquelle elle se met à défiler.
    */
    expect(source).toContain(
      "const PISTE_LARGEUR_PLANCHER_PX = REGIMES_DE_PISTE[0].largeurPx;",
    );
    expect(source).toContain("minWidth: PISTE_LARGEUR_PLANCHER_PX");
  });
});
