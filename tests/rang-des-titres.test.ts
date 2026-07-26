import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import { cardHeadingTag } from "@/lib/page-typography";

/**
 * Aucun rang de titre sauté sur la vue équipe.
 *
 * `MonEquipeSection` s'affiche à deux endroits, et le titre « Mon équipe » ne
 * vient pas du même endroit dans les deux cas : sur le tableau de bord
 * d'administration la section l'écrit elle-même en « h2 », sur la page qui lui
 * est dédiée c'est la page qui le porte en « h1 » et la section se tait. Les
 * titres des trois cartes qu'elle contient ne peuvent donc pas être figés : à
 * « h3 » ils s'accrochent au « h1 » de la page dédiée en sautant le rang 2, et
 * la personne qui navigue de titre en titre lit ce trou comme un titre qu'elle
 * n'a pas su atteindre.
 *
 * Le test lit les sources : la suite tourne en environnement Node, sans DOM,
 * et le plan du document n'est donc pas observable ici autrement.
 */
const RACINE = path.resolve(__dirname, "..");

function source(relatif: string): string {
  return readFileSync(path.join(RACINE, relatif), "utf8");
}

describe("rang des titres de la vue équipe", () => {
  it("la page dédiée porte le titre, donc les cartes se lisent au rang 2", () => {
    const page = source("app/[locale]/company/equipe/page.tsx");

    expect(page).toContain("showHeading={false}");
    expect(cardHeadingTag(false)).toBe("h2");
  });

  it("le tableau de bord laisse le titre à la section, donc les cartes se lisent au rang 3", () => {
    const shell = source("components/organisms/dashboard-admin-shell.tsx");

    expect(shell).not.toContain("showHeading");
    expect(cardHeadingTag(true)).toBe("h3");
  });

  it("la section tient le rang de ses cartes de son propre titre", () => {
    const section = source("components/organisms/mon-equipe-section.tsx");

    expect(section).toContain("cardHeadingTag(showHeading)");
    /*
      Le « h2 » de la section reste écrit en clair, lui : il ne dépend de rien
      d'autre que de `showHeading`, qui décide déjà de son existence.
    */
    expect(section).not.toMatch(/<h3\b/);
  });

  it("les deux cartes collectives ne figent aucun rang", () => {
    const collectif = source(
      "components/organisms/team-collective-overview.tsx",
    );

    expect(collectif).toContain("niveauDeTitre");
    expect(collectif).not.toMatch(/<h[1-6]\b/);
  });
});
