import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  orgKissRollupScopeKey,
  sellerCoachingScopeKey,
} from "@/src/core/application/ai-summary-cache-scopes";

/**
 * Un seul écran, deux lecteurs, deux voix qui ne se mélangent pas.
 *
 * Le commercial lit sur « Ma performance » la fiche que son manager ouvre sur
 * lui depuis « Mon équipe » : même chargeur, même composant, mêmes chiffres.
 * Seuls changent trois textes écrits par l'IA, qui s'adressent à quelqu'un et
 * qui sont mis en cache. Si leur clé ne dit pas à qui ils parlent, les deux
 * écrans se partagent une ligne : le premier ouvert l'écrit, le second y lit un
 * texte rédigé pour l'autre, et le commercial se voit conseiller des rituels de
 * coaching à mener sur un tiers.
 *
 * Ce que ce test ne couvre pas. Il vérifie que les deux voix ont des clés
 * distinctes et que chaque écran annonce la sienne ; il ne dit rien de ce que
 * le texte raconte, écrit par un modèle appelé au travers du réseau, hors de
 * portée d'une suite qui tourne en environnement Node. Il ne couvre pas non
 * plus les libellés des quatre cases KISS servies au commercial : ils sont
 * cités mot pour mot dans le commentaire qui explique pourquoi ils ne peuvent
 * pas être empruntés au manager, si bien qu'aucun décompte de leurs
 * occurrences dans le fichier ne séparerait la citation de l'usage.
 *
 * Les assertions sur les pages lisent les sources : la suite tourne sans DOM
 * et sans base, et l'assemblage d'une page serveur n'y est pas observable
 * autrement.
 */
const RACINE = path.resolve(__dirname, "..");

function source(relatif: string): string {
  return readFileSync(path.join(RACINE, relatif), "utf8");
}

const FICHE_MANAGER = "app/[locale]/company/equipe/[userId]/page.tsx";
const MA_PERFORMANCE = "app/[locale]/company/analyse/page.tsx";

describe("les deux lecteurs ne se partagent pas la même ligne de cache", () => {
  const commun = { statsWindowDays: 30 as const, sellerUserId: "cm1seller" };

  it("le récit KISS d'un commercial change de clé selon son lecteur", () => {
    const pourLeManager = orgKissRollupScopeKey({
      ...commun,
      audience: "manager",
    });
    const pourLeCommercial = orgKissRollupScopeKey({
      ...commun,
      audience: "commercial",
    });

    expect(pourLeManager).not.toBe(pourLeCommercial);
  });

  it("son coaching change de clé selon son lecteur", () => {
    const pourLeManager = sellerCoachingScopeKey({
      ...commun,
      audience: "manager",
    });
    const pourLeCommercial = sellerCoachingScopeKey({
      ...commun,
      audience: "commercial",
    });

    expect(pourLeManager).not.toBe(pourLeCommercial);
  });

  it("deux lectures d'un même écran retombent sur la même ligne", () => {
    /*
      L'autre moitié du contrat : une clé qui distingue tout ne cache plus
      rien. Sans cette vérification, ajouter n'importe quoi de variable à la
      clé passerait les deux assertions ci-dessus.
    */
    expect(orgKissRollupScopeKey({ ...commun, audience: "manager" })).toBe(
      orgKissRollupScopeKey({ ...commun, audience: "manager" }),
    );
    expect(sellerCoachingScopeKey({ ...commun, audience: "manager" })).toBe(
      sellerCoachingScopeKey({ ...commun, audience: "manager" }),
    );
  });
});

describe("chaque écran annonce le lecteur auquel il parle", () => {
  it("la fiche ouverte depuis « Mon équipe » demande la voix du manager", () => {
    const fiche = source(FICHE_MANAGER);

    expect(fiche).toContain('audience: "manager"');
    expect(fiche).not.toContain('audience: "commercial"');
  });

  it("« Ma performance » demande la voix du commercial", () => {
    const maPerformance = source(MA_PERFORMANCE);

    expect(maPerformance).toContain('audience: "commercial"');
    expect(maPerformance).toContain('perspective="commercial"');
  });

  it("le même fichier garde la voix du manager pour l'écran d'équipe", () => {
    /*
      « Ma performance » sert les deux rôles : la fiche individuelle au
      commercial, le tableau collectif au manager. Les deux voix cohabitent
      donc dans ce fichier, et c'est leur cohabitation qu'il faut garder.
    */
    expect(source(MA_PERFORMANCE)).toContain('audience: "manager"');
  });

  it("les deux écrans montent le même composant et le même chargeur", () => {
    /*
      Deux assemblages parallèles auraient divergé au premier indicateur
      ajouté d'un seul côté, et le manager et son commercial se seraient assis
      côte à côte devant deux écrans qui ne disent pas la même chose.

      Les deux motifs cherchent l'emploi et non le nom : la parenthèse ouvrante
      distingue l'appel de l'import, et le chevron le montage de la balise.
      Cherchés nus, les deux noms restent présents dans un fichier qui a cessé
      de s'en servir, et le test passerait au vert sur la panne qu'il garde.
    */
    for (const fichier of [FICHE_MANAGER, MA_PERFORMANCE]) {
      const texte = source(fichier);

      expect(texte).toContain("loadTeamMemberPerformanceView(");
      expect(texte).toContain("<TeamMemberPerformanceShell");
    }
  });
});
