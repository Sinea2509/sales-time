import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

/**
 * Un titre, une fois.
 *
 * `MonEquipeSection` sait porter son propre titre, parce qu'elle vit aussi au
 * milieu d'autres sections sur le tableau de bord d'administration, où elle a
 * besoin de se nommer. Sur la page qui lui est dédiée, l'en-tête de page dit
 * déjà « Mon équipe » : sans consigne, le mot s'affichait deux fois de suite,
 * à deux tailles différentes, ce qui se lit comme un rendu cassé.
 *
 * Ce test lit les sources plutôt qu'un rendu : la suite tourne en environnement
 * Node, sans DOM. Il vérifie donc les deux appels réels du composant, et rien
 * d'autre : le jour où un troisième apparaît, il faudra venir le décider ici.
 */
const RACINE = path.resolve(__dirname, "..");

function source(relatif: string): string {
  return readFileSync(path.join(RACINE, relatif), "utf8");
}

/** L'appel à `MonEquipeSection`, de la balise ouvrante à sa fermeture. */
function appelMonEquipeSection(contenu: string): string {
  const debut = contenu.indexOf("<MonEquipeSection");
  expect(debut).toBeGreaterThan(-1);
  const fin = contenu.indexOf("/>", debut);
  expect(fin).toBeGreaterThan(debut);
  return contenu.slice(debut, fin);
}

describe("titres en double", () => {
  it("la page dédiée porte le titre et demande à la section de se taire", () => {
    const page = source("app/[locale]/company/equipe/page.tsx");

    // La page affiche bien « Mon équipe » en en-tête.
    expect(page).toContain('<PageHeaderSimple title="Mon équipe" />');
    expect(appelMonEquipeSection(page)).toContain("showHeading={false}");
  });

  it("le tableau de bord d'administration garde le titre de la section", () => {
    const shell = source("components/organisms/dashboard-admin-shell.tsx");

    // Aucun en-tête de page ne nomme l'équipe ici : la section doit le faire.
    expect(shell).not.toContain('title="Mon équipe"');
    expect(appelMonEquipeSection(shell)).not.toContain("showHeading");
  });

  it("la section n'écrit son titre que lorsqu'on le lui demande", () => {
    const section = source("components/organisms/mon-equipe-section.tsx");

    expect(section).toContain(
      "{showHeading ? (\n          <h2 className={sectionHeadingClass}>Mon équipe</h2>\n        ) : null}",
    );
  });
});
