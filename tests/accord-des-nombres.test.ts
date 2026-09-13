import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * L'accord de « membre » et de « RDV noté » se décide en un seul endroit.
 *
 * La faute que ce garde-fou refuse ne se voit qu'à un seul chiffre : trois
 * écrans de la vue manager composaient chacun leur phrase de leur côté, et l'un
 * d'eux écrivait « moyenne des 1 membre classés » le jour où une équipe démarre
 * avec une seule personne notée. Le nom venait d'une fonction, le participe
 * d'un ternaire posé dans le rendu ; personne ne les avait jamais vus côte à
 * côte.
 *
 * Deux interdits, donc, et ils se complètent : aucun fichier ne redéclare les
 * fonctions de `lib/accord-fr.ts`, et aucun ne fabrique dans son rendu la
 * marque du pluriel de ces noms-là. Le premier attrape la copie du module, le
 * second la phrase assemblée sur place, qui est la forme sous laquelle la faute
 * était réellement apparue.
 *
 * La règle ne vaut que pour les noms que `lib/accord-fr.ts` prend en charge.
 * D'autres écrans accordent encore « rendez-vous coaché » ou « point » de leur
 * côté ; les rassembler est un autre travail, et un garde-fou qui échouerait
 * dès aujourd'hui ne garderait rien du tout.
 */
const RACINE = path.resolve(__dirname, "..");

/** Là où vit du code de rendu. `tests/` s'exclut : ce fichier cite les fautes. */
const DOSSIERS = ["app", "components", "lib", "src"];

/** Le module de référence : c'est lui qui a le droit de déclarer l'accord. */
const MODULE_DE_REFERENCE = path.join("lib", "accord-fr.ts");

/**
 * La marque du pluriel fabriquée dans le rendu, juste derrière le nom.
 *
 * Les deux formes réellement rencontrées sont voisines : `noté${n > 1 ? "s"`
 * dans un gabarit, `classé{n > 1 ? "s"` dans du JSX. Le nom est exigé accentué,
 * sans quoi le mot anglais « classes » suffirait à déclencher une fausse
 * alerte.
 */
const PLURIEL_FABRIQUE = /(membres?|RDV\s+notés?|classés?)[^\n]{0,60}\?\s*"s"/;

/** Les fonctions dont la copie locale est précisément ce qui a produit la faute. */
const FONCTIONS = ["membres", "membresClasses", "rdvNotes"];

function fichiersSources(): string[] {
  const trouves: string[] = [];
  const parcourir = (dossier: string) => {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = path.join(dossier, entree.name);
      if (entree.isDirectory()) {
        if (entree.name === "node_modules" || entree.name === "generated") {
          continue;
        }
        parcourir(chemin);
        continue;
      }
      if (/\.tsx?$/.test(entree.name)) trouves.push(chemin);
    }
  };
  for (const dossier of DOSSIERS) parcourir(path.join(RACINE, dossier));
  return trouves.map((chemin) => path.relative(RACINE, chemin));
}

describe("accord des dénombrements de la vue équipe", () => {
  it("aucun rendu ne fabrique lui-même le pluriel de « membre » ou de « RDV noté »", () => {
    const fautifs = fichiersSources().filter((relatif) =>
      PLURIEL_FABRIQUE.test(readFileSync(path.join(RACINE, relatif), "utf8")),
    );
    expect(fautifs).toEqual([]);
  });

  it("un seul module déclare ces fonctions", () => {
    const declarations = new Map<string, string[]>();
    for (const relatif of fichiersSources()) {
      const source = readFileSync(path.join(RACINE, relatif), "utf8");
      for (const nom of FONCTIONS) {
        if (!new RegExp(`function\\s+${nom}\\s*\\(`).test(source)) continue;
        declarations.set(nom, [...(declarations.get(nom) ?? []), relatif]);
      }
    }
    for (const nom of FONCTIONS) {
      expect(declarations.get(nom)).toEqual([MODULE_DE_REFERENCE]);
    }
  });
});
