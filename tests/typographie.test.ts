import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Le tiret cadratin est proscrit dans ce projet.
 *
 * On le construit par son point de code plutôt que de l'écrire, pour que ce
 * fichier n'ait pas à figurer dans sa propre liste d'exceptions.
 */
const TIRET_CADRATIN = String.fromCodePoint(0x2014);

const RACINE = path.resolve(__dirname, "..");

/** Ni du texte, ni relu par un humain : les lire ne dirait rien. */
const EXTENSIONS_BINAIRES = new Set([".png", ".ico", ".pdf"]);

/**
 * Les seuls endroits où le caractère a le droit d'apparaître : ceux où il est
 * le sujet du code, pas sa ponctuation.
 *
 * Le compte attendu est explicite, donc un tiret de plus glissé dans un de
 * ces cinq fichiers fait échouer le test comme partout ailleurs.
 */
const CITATIONS_VOLONTAIRES: Record<string, number> = {
  // Nettoie une puce collée par l'IA, quel que soit le tiret qu'elle a choisi.
  "components/molecules/kiss-result-view.tsx": 1,
  "src/core/domain/kiss-coaching-bullets-from-meetings.ts": 1,
  // Vérifie justement que le coach IA n'en produit pas.
  "src/core/domain/team-ranking.test.ts": 1,
  "lib/ai-system-prompt.ts": 1,
  "lib/ai-system-prompt.test.ts": 5,
};

function fichiersSuivis(): string[] {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: RACINE,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean)
    .filter((rel) => !EXTENSIONS_BINAIRES.has(path.extname(rel).toLowerCase()));
}

function compteParFichier(): Map<string, number> {
  const compte = new Map<string, number>();
  for (const rel of fichiersSuivis()) {
    const texte = readFileSync(path.join(RACINE, rel), "utf8");
    let n = 0;
    for (const c of texte) if (c === TIRET_CADRATIN) n += 1;
    if (n > 0) compte.set(rel, n);
  }
  return compte;
}

describe("typographie", () => {
  it("balaie tout le dépôt, sinon un test vert ne prouverait rien", () => {
    // Le dépôt en suit environ 760 hors binaires : un plancher à 500 attrape
    // un « git ls-files » muet ou un filtre trop gourmand.
    expect(fichiersSuivis().length).toBeGreaterThan(500);
  });

  it("n'écrit aucun tiret cadratin hors des fichiers qui le citent", () => {
    const trouve = compteParFichier();
    const inattendus = [...trouve.entries()]
      .filter(([rel]) => CITATIONS_VOLONTAIRES[rel] === undefined)
      .map(([rel, n]) => `${rel} : ${n}`);

    expect(inattendus).toEqual([]);
  });

  it("garde le compte exact dans les fichiers qui le citent", () => {
    const trouve = compteParFichier();
    const reel: Record<string, number> = {};
    for (const rel of Object.keys(CITATIONS_VOLONTAIRES)) {
      reel[rel] = trouve.get(rel) ?? 0;
    }

    expect(reel).toEqual(CITATIONS_VOLONTAIRES);
  });
});
