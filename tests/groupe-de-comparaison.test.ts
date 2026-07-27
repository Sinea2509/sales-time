import { describe, expect, it } from "@jest/globals";

import { sousTitreDuGroupe } from "@/components/organisms/dashboard-standing-card";
import { avertissementDeCadrage } from "@/lib/avertissement-de-cadrage";
import { scopeMembersToTeam, teamScopeGroup } from "@/lib/team-seller-scope";

/**
 * Le mot qui nomme le groupe doit désigner celui sur lequel le rang a été
 * calculé.
 *
 * Trois écrans affichent une place : le tableau de bord du commercial, sa fiche
 * sur « /company/analyse », et la fiche que son manager ouvre depuis « Mon
 * équipe ». Tous les trois écrivaient « la moyenne d'équipe » et « parmi les 7
 * de l'équipe », quel que soit le périmètre qui avait servi à les calculer.
 * Quand aucun périmètre n'existe, ces chiffres portent sur l'organisation
 * entière : le commercial dont aucun manager n'est déclaré, et le manager qui
 * n'a encore personne de rattaché, lisaient donc « équipe » sur un nombre pris
 * sur quarante personnes. Le défaut ne lève aucune erreur et ne se voit sur
 * aucune capture ; il fait seulement mentir la phrase.
 *
 * Le même défaut a une seconde face, du côté du manager : la page « Mon équipe »
 * porte ce titre en listant l'organisation entière quand personne ne lui est
 * rattaché. Ce n'est pas une phrase de comparaison qu'il faut y corriger, mais
 * un mot qu'il faut définir, d'où un second libellé tiré du même périmètre. Le
 * démentir ne marcherait pas : les cartes posées juste au-dessous emploient
 * « équipe » une dizaine de fois sans rien savoir du périmètre.
 *
 * Ce que ces tests ne couvrent pas : ils ne rendent rien. Ils ne disent rien de
 * la place de ces libellés à l'écran, ni du fait que la carte ou la section les
 * affichent vraiment, ni de la propagation de `comparisonGroup` depuis les pages
 * jusqu'aux composants, qui n'est gardée que par le typage. Ils ne couvrent pas
 * non plus la formulation elle-même : « la moyenne de l'organisation » pourrait
 * être remplacée par n'importe quelle autre tournure sans qu'aucune assertion ne
 * bouge, dès lors qu'elle diffère de celle de l'équipe.
 */

/** Un membre du tableau, dont seul l'identifiant compte ici. */
function membre(userId: string) {
  return { userId };
}

/**
 * Les six périmètres qui servent de témoin aux deux vérifications de cohérence.
 *
 * La liste doit être la même des deux côtés, sans quoi les deux tests
 * n'établiraient plus que le mot et le silence répondent à la question que
 * `scopeMembersToTeam` pose pour filtrer. Le sixième ne retient personne tout
 * en cadrant : le rang porte alors sur une équipe, même déserte.
 */
const LISTE_DE_CADRAGES = [undefined, null, [], ["u1"], ["u1", "u2"], ["u3"]];

describe("teamScopeGroup", () => {
  it("nomme l'organisation quand aucun périmètre n'a été résolu", () => {
    // `undefined` est ce que rendent les deux résolutions quand rien n'est
    // déclaré ; `null` protège la même signature côté appelants.
    expect(teamScopeGroup(undefined)).toBe("organization");
    expect(teamScopeGroup(null)).toBe("organization");
  });

  it("nomme l'organisation sur un périmètre vide", () => {
    expect(teamScopeGroup([])).toBe("organization");
  });

  it("nomme l'équipe dès qu'un périmètre existe", () => {
    // Un seul identifiant suffit : c'est le cas du manager qui n'a qu'un
    // commercial rattaché, et son rang porte bien sur ces deux-là.
    expect(teamScopeGroup(["u1"])).toBe("team");
    expect(teamScopeGroup(["u1", "u2"])).toBe("team");
  });

  it("dit « équipe » exactement quand le périmètre filtre vraiment", () => {
    /*
      Le point de tout l'exercice : le mot et le filtre doivent répondre à la
      même question. `scopeMembersToTeam` rend le tableau reçu par identité
      quand il ne cadre rien, ce qui donne un témoin exact du cadrage sans
      dépendre de son écriture interne.
    */
    const membres = [membre("u1"), membre("u2")];
    for (const cadrage of LISTE_DE_CADRAGES) {
      const filtre = scopeMembersToTeam(membres, cadrage) !== membres;
      expect(teamScopeGroup(cadrage)).toBe(filtre ? "team" : "organization");
    }
  });
});

describe("sousTitreDuGroupe", () => {
  it("nomme le manager qui donne son périmètre au rang", () => {
    const sousTitre = sousTitreDuGroupe("team", "Claire Fontaine");
    expect(sousTitre.texte).toBe("Équipe de Claire Fontaine");
    // Le nom se lit en clair : rien à expliquer, donc pas d'infobulle.
    expect(sousTitre.title).toBeUndefined();
  });

  it("dit l'absence de rattachement quand le rang porte sur l'organisation", () => {
    const sousTitre = sousTitreDuGroupe("organization", null);
    expect(sousTitre.texte).toBe("Aucun manager déclaré");
    expect(sousTitre.title).toContain("organisation");
  });

  it("garde ce libellé même si un nom de manager traînait", () => {
    // Le cadrage commande, pas le nom. Un rang non cadré reste un rang sur
    // l'organisation, quand bien même un nom serait disponible.
    expect(sousTitreDuGroupe("organization", "Claire Fontaine").texte).toBe(
      "Aucun manager déclaré",
    );
  });

  it("distingue le manager parti de l'organisation du manager absent", () => {
    /*
      `removeMemberAction` efface l'adhésion sans toucher au rattachement : le
      rang reste cadré sur l'équipe, mais le nom ne se trouve plus. Écrire ici
      « Aucun manager déclaré » renverrait ce lecteur à une organisation sur
      laquelle il n'a pas été classé.
    */
    const sousTitre = sousTitreDuGroupe("team", null);
    expect(sousTitre.texte).not.toBe("Aucun manager déclaré");
    expect(sousTitre.texte).not.toContain("Équipe de");
    expect(sousTitre.texte.trim().length).toBeGreaterThan(0);
    // Ce cas est assez rare pour mériter sa phrase : sans elle, le lecteur ne
    // saurait pas pourquoi son équipe n'a pas de nom.
    expect(sousTitre.title).toBeTruthy();
  });
});

describe("avertissementDeCadrage", () => {
  it("se tait quand la page montre bien une équipe", () => {
    // Le cas courant. Une bannière posée là en permanence perdrait tout son
    // sens le jour où elle dirait quelque chose.
    expect(avertissementDeCadrage("team")).toBeNull();
  });

  it("définit le mot quand la page liste l'organisation entière", () => {
    const phrase = avertissementDeCadrage("organization");
    expect(phrase).not.toBeNull();
    // Le lecteur a « Mon équipe » sous les yeux : la phrase doit nommer ce
    // qu'il regarde vraiment, sans quoi elle ne corrige rien.
    expect(phrase).toContain("organisation");
  });

  it("dit lesquels des chiffres affichés sont concernés", () => {
    /*
      La page pose trois lectures collectives au-dessus du tableau : un
      classement, une moyenne et des paliers. Prévenir du périmètre sans dire
      qu'il les commande toutes les trois laisserait le lecteur croire que seule
      la liste est en cause, et sa moyenne juste.
    */
    const phrase = avertissementDeCadrage("organization") ?? "";
    expect(phrase).toContain("classement");
    expect(phrase).toContain("moyenne");
    expect(phrase).toContain("paliers");
  });

  it("parle exactement quand le périmètre ne filtre pas", () => {
    /*
      Même témoin que pour `teamScopeGroup`, et pour la même raison : la phrase
      et le filtre doivent répondre à la même question. Un avertissement qui
      s'afficherait sur une équipe réellement cadrée serait un mensonge de plus,
      pas un de moins.
    */
    const membres = [membre("u1"), membre("u2")];
    for (const cadrage of LISTE_DE_CADRAGES) {
      const filtre = scopeMembersToTeam(membres, cadrage) !== membres;
      const phrase = avertissementDeCadrage(teamScopeGroup(cadrage));
      expect(phrase === null).toBe(filtre);
    }
  });
});
