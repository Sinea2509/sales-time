import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Une commande que l'utilisateur pilote doit montrer où est le clavier.
 *
 * Les trois champs de base du produit (« Input », « Textarea », le déclencheur
 * de « Select ») posaient « focus-visible:border-input » sur une base qui
 * portait déjà « border-input » : la bordure était repeinte de sa propre
 * couleur. Avec « outline-none » à côté, qui retire le contour du navigateur,
 * tabuler dans un formulaire du produit ne produisait plus aucun changement
 * visible. Rien ne plantait, aucune capture ne le montrait, et personne au
 * clavier ne savait plus où il se trouvait.
 *
 * Ce garde-fou relit les listes de classes du dépôt et refuse celles qui
 * retirent l'indication du navigateur sans en remettre une.
 *
 * Ce qu'il ne couvre pas : il ne rend rien, il lit du texte source. Une classe
 * qui arrive par une variable, par un objet remis à « clsx » ou par une
 * variante de « cva » lui échappe. Il ne dit rien de la couleur de l'anneau ni
 * de son contraste sur le fond, rien de son épaisseur, et rien du cas où un
 * parent en « overflow-hidden » le rogne. Il laisse de côté les commandes dont
 * la position du clavier se montre autrement : un attribut « data- » repeint
 * par le parent, comme les entrées de menu et les onglets, ou un contour natif
 * laissé en place. Enfin il ne vérifie pas que la classe de remplacement porte
 * bien sur le même élément que celle qui coupe : il lit une liste, pas le DOM.
 */

const RACINE = path.resolve(__dirname, "..");

/** Une liste de classes relevée dans un fichier, avec sa ligne. */
type ListeDeClasses = { texte: string; ligne: number };

/*
  Une suite de chaînes séparées seulement par des virgules et des blancs forme
  une seule liste de classes : c'est ce que « cn(...) » recolle avant de
  l'envoyer au navigateur. Les lire une par une conclurait qu'il manque
  « focus-visible:ring-2 » alors qu'il est dans l'argument suivant.
*/
const SUITE_DE_CHAINES =
  /"((?:[^"\\\n]|\\.)*)"(?:\s*,\s*"(?:[^"\\\n]|\\.)*")*/g;
const UN_MORCEAU = /"((?:[^"\\\n]|\\.)*)"/g;

/*
  Ce qui prouve qu'un élément est une commande et non un décor : il réagit au
  survol, il sait être désactivé, il porte un texte d'invite, ou il annonce sa
  prise au pointeur. Un bloc qui ne nomme aucun de ces états ne se pilote pas,
  et n'a donc rien à montrer au clavier.
*/
const MARQUEURS_DE_COMMANDE =
  /^(hover:|disabled:|placeholder:|cursor-pointer$|cursor-grab$)/;

/** Les classes qui coupent, et ne peuvent donc pas se compter en remplacement. */
const NE_MONTRE_RIEN = new Set(["ring-0", "outline-none", "ring-transparent"]);

/** Les utilitaires qui peignent quelque chose de visible au focus. */
const PEINT_QUELQUE_CHOSE = /^(ring|inset-ring|border|outline|shadow|bg|text)-/;

function fichiersTsx(): string[] {
  return execFileSync("git", ["ls-files", "-z", "--", "*.tsx"], {
    cwd: RACINE,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean);
}

function listesDeClasses(source: string): ListeDeClasses[] {
  const out: ListeDeClasses[] = [];
  for (const m of source.matchAll(SUITE_DE_CHAINES)) {
    const morceaux = [...m[0].matchAll(UN_MORCEAU)].map((x) => x[1]);
    out.push({
      texte: morceaux.join(" "),
      ligne: source.slice(0, m.index).split("\n").length,
    });
  }
  return out;
}

function jetons(liste: string): string[] {
  return liste.split(/\s+/).filter(Boolean);
}

/** La liste retire-t-elle ce que le navigateur montrait tout seul ? */
function coupeLeFocus(liste: string): boolean {
  const j = jetons(liste);
  const annule =
    j.includes("outline-none") ||
    j.includes("focus-visible:outline-none") ||
    j.includes("focus:outline-none") ||
    j.includes("focus-visible:ring-0");
  if (!annule) return false;
  /*
    « focus-visible:ring-0 » ne se prononce que sur l'état de focus : l'écrire
    est une décision sur cet état, quel que soit le reste de la liste. Le nu
    « outline-none » sert aussi à des blocs de mise en page, d'où le passage
    par les marqueurs.
  */
  if (j.includes("focus-visible:ring-0")) return true;
  return j.some((tok) => MARQUEURS_DE_COMMANDE.test(tok));
}

/** La classe qui remet une indication au focus, ou null s'il n'y en a pas. */
function remplacementVisible(liste: string): string | null {
  const j = jetons(liste);
  for (const tok of j) {
    if (!tok.startsWith("focus-visible:") && !tok.startsWith("focus:"))
      continue;
    const util = tok.replace(/^focus(-visible)?:/, "");
    if (NE_MONTRE_RIEN.has(util)) continue;
    if (!PEINT_QUELQUE_CHOSE.test(util)) continue;
    /*
      Le défaut discret : « focus-visible:border-input » posé sur une base qui
      contient déjà « border-input » repeint la bordure de sa propre couleur.
      La classe existe, la feuille de style la produit, et l'écran ne change
      pas d'un pixel.
    */
    if (util.startsWith("border-") && j.includes(util)) continue;
    return tok;
  }
  return null;
}

type Balayage = {
  fichiers: number;
  listes: number;
  coupent: string[];
  fautives: string[];
};

let cache: Balayage | null = null;

function balayage(): Balayage {
  if (cache) return cache;
  const fichiers = fichiersTsx();
  const coupent: string[] = [];
  const fautives: string[] = [];
  let listes = 0;
  for (const rel of fichiers) {
    const source = readFileSync(path.join(RACINE, rel), "utf8");
    for (const liste of listesDeClasses(source)) {
      listes += 1;
      if (!coupeLeFocus(liste.texte)) continue;
      coupent.push(`${rel}:${liste.ligne}`);
      if (remplacementVisible(liste.texte) === null) {
        fautives.push(`${rel}:${liste.ligne}`);
      }
    }
  }
  cache = { fichiers: fichiers.length, listes, coupent, fautives };
  return cache;
}

describe("indication de focus", () => {
  it("lit vraiment le dépôt, sinon un test vert ne prouverait rien", () => {
    const vu = balayage();
    // Le dépôt suit environ 255 fichiers .tsx pour environ 7 500 listes de
    // classes. Les planchers attrapent un « git ls-files » muet ou une
    // expression régulière cassée, qui feraient passer le balayage à vide.
    expect(vu.fichiers).toBeGreaterThan(150);
    expect(vu.listes).toBeGreaterThan(3000);
  });

  it("reconnaît encore les listes qui coupent le focus", () => {
    // Elles sont 18 aujourd'hui, toutes pourvues d'un remplacement. Un
    // analyseur qui n'en verrait plus aucune passerait le test suivant sans
    // rien avoir lu.
    expect(balayage().coupent.length).toBeGreaterThanOrEqual(10);
  });

  it("ne laisse aucune commande sans indication de focus", () => {
    expect(balayage().fautives).toEqual([]);
  });
});

/*
  Les cas ci-dessous ne balaient rien : ils fixent la règle elle-même, pour
  qu'elle reste lisible quand le dépôt aura changé.
*/
const CAS_DE_REFERENCE: {
  liste: string;
  fautive: boolean;
  pourquoi: string;
}[] = [
  {
    liste: "rounded-md p-2 outline-none hover:bg-muted",
    fautive: true,
    pourquoi: "elle se survole, donc elle se pilote, et rien ne la remplace",
  },
  {
    liste:
      "rounded-md p-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand",
    fautive: false,
    pourquoi: "un anneau plein prend la place du contour retiré",
  },
  {
    liste:
      "border border-input outline-none placeholder:text-muted-foreground focus-visible:border-input",
    fautive: true,
    pourquoi:
      "la bordure est repeinte de sa propre couleur : la classe existe, l'écran ne bouge pas",
  },
  {
    liste:
      "border border-input outline-none placeholder:text-muted-foreground focus-visible:border-brand",
    fautive: false,
    pourquoi: "la bordure change de couleur, donc elle se voit",
  },
  {
    liste:
      "overflow-hidden outline-none hover:bg-muted focus-visible:inset-ring-2 focus-visible:inset-ring-brand",
    fautive: false,
    pourquoi:
      "dans un cadre qui rogne, l'anneau posé à l'intérieur reste visible",
  },
  {
    liste: "rounded-md p-2 outline-none",
    fautive: false,
    pourquoi: "aucun état piloté n'est nommé : c'est un bloc, pas une commande",
  },
  {
    liste: "rounded-md p-2 focus-visible:ring-0",
    fautive: true,
    pourquoi:
      "annuler l'anneau est une décision sur le focus, marqueurs ou pas",
  },
];

describe("la règle, sur des listes écrites à la main", () => {
  for (const cas of CAS_DE_REFERENCE) {
    it(`${cas.fautive ? "refuse" : "accepte"} : ${cas.pourquoi}`, () => {
      const fautive =
        coupeLeFocus(cas.liste) && remplacementVisible(cas.liste) === null;
      expect(fautive).toBe(cas.fautive);
    });
  }
});
