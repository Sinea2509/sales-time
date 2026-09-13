import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Un titre une fois, un bouton une fois.
 *
 * `MonEquipeSection` sait porter son propre titre et son propre bouton
 * d'invitation, parce qu'elle vit aussi au milieu d'autres sections sur le
 * tableau de bord d'administration, où rien d'autre ne les porte. Sur la page
 * qui lui est dédiée, l'en-tête de page dit déjà « Mon équipe » et range le
 * bouton à côté du sélecteur de période : sans consigne, chacun des deux
 * s'affichait deux fois, ce qui se lit comme un rendu cassé.
 *
 * Ce test lit les sources plutôt qu'un rendu : la suite tourne en environnement
 * Node, sans DOM. Il vérifie les deux appels réels du composant, et rien
 * d'autre : le jour où un troisième apparaît, il faudra venir le décider ici.
 *
 * Les extraits attendus sont comparés sur une source dont les blancs sont
 * réduits à une espace. Ce que le test protège est la condition qui entoure
 * chaque élément, pas la colonne où il se trouve : la version précédente
 * échouait dès qu'un bloc gagnait un niveau d'imbrication, sans que l'invariant
 * ait bougé.
 */
const RACINE = path.resolve(__dirname, "..");

function source(relatif: string): string {
  return readFileSync(path.join(RACINE, relatif), "utf8");
}

/** La même source, sans retours à la ligne ni indentation. */
function surUneLigne(contenu: string): string {
  return contenu.replace(/\s+/g, " ");
}

/** L'appel à `MonEquipeSection`, de la balise ouvrante à sa fermeture. */
function appelMonEquipeSection(contenu: string): string {
  const debut = contenu.indexOf("<MonEquipeSection");
  expect(debut).toBeGreaterThan(-1);
  const fin = contenu.indexOf("/>", debut);
  expect(fin).toBeGreaterThan(debut);
  return contenu.slice(debut, fin);
}

/** Tous les appels à `PageHeaderSimple`, chacun de sa balise à sa fermeture. */
function appelsDuTitreDePage(contenu: string): string[] {
  const appels: string[] = [];
  let debut = contenu.indexOf("<PageHeaderSimple");
  while (debut > -1) {
    const fin = contenu.indexOf("/>", debut);
    expect(fin).toBeGreaterThan(debut);
    appels.push(contenu.slice(debut, fin));
    debut = contenu.indexOf("<PageHeaderSimple", fin);
  }
  return appels;
}

describe("titres en double", () => {
  it("la page dédiée porte le titre et demande à la section de se taire", () => {
    const page = source("app/[locale]/company/equipe/page.tsx");

    /*
      La page a trois en-têtes : celui du rendu complet et ceux des deux sorties
      anticipées, quand l'organisation ou le tableau de bord manquent. Les trois
      nomment la page, sans quoi l'une d'elles s'ouvrirait sans titre.
    */
    const titres = appelsDuTitreDePage(page);
    expect(titres.length).toBeGreaterThan(0);
    for (const titre of titres) {
      expect(titre).toContain('title="Mon équipe"');
    }

    expect(appelMonEquipeSection(page)).toContain("showHeading={false}");
  });

  it("la page dédiée porte le bouton et demande à la section de se taire", () => {
    const page = source("app/[locale]/company/equipe/page.tsx");

    expect(page).toContain("<TeamMemberInviteDialog");
    expect(appelMonEquipeSection(page)).toContain("showInvite={false}");
  });

  it("le tableau de bord d'administration garde le titre de la section", () => {
    const shell = source("components/organisms/dashboard-admin-shell.tsx");

    // Aucun en-tête de page ne nomme l'équipe ici : la section doit le faire.
    expect(shell).not.toContain('title="Mon équipe"');
    const appel = appelMonEquipeSection(shell);
    expect(appel).not.toContain("showHeading");
    expect(appel).not.toContain("showInvite");
  });

  it("la section n'écrit son titre que lorsqu'on le lui demande", () => {
    const section = surUneLigne(
      source("components/organisms/mon-equipe-section.tsx"),
    );

    expect(section).toContain(
      "{showHeading ? ( <h2 className={sectionHeadingClass}>Mon équipe</h2> ) : null}",
    );
  });

  it("la section n'affiche le bouton que lorsqu'on le lui demande", () => {
    const section = surUneLigne(
      source("components/organisms/mon-equipe-section.tsx"),
    );

    expect(section).toContain(
      "{showInvite ? ( <TeamMemberInviteDialog currentUserEmail={currentUserEmail} /> ) : null}",
    );
  });
});
