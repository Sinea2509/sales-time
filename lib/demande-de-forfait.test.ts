import {
  FORFAITS_PROPOSES,
  FORFAIT_INITIAL,
  ID_CHAMP_FORFAIT_SOUHAITE,
  ID_FORMULAIRE_DEMANDE,
  LONGUEUR_MAX_MESSAGE,
} from "@/lib/demande-de-forfait";

describe("demande de forfait", () => {
  it("propose un forfait par défaut qui existe dans la liste", () => {
    // Un défaut absent de la liste laisserait le sélecteur sur sa première
    // option sans prévenir : la demande partirait avec le mauvais forfait.
    expect(FORFAITS_PROPOSES).toContain(FORFAIT_INITIAL);
  });

  it("ne propose pas deux fois le même forfait", () => {
    expect(new Set(FORFAITS_PROPOSES).size).toBe(FORFAITS_PROPOSES.length);
  });

  it("donne des identifiants utilisables comme ancre et comme sélecteur CSS", () => {
    // `#Forfait souhaité` ne serait ni une ancre valide ni un sélecteur : le
    // lien des cartes ne mènerait nulle part.
    for (const id of [ID_FORMULAIRE_DEMANDE, ID_CHAMP_FORFAIT_SOUHAITE]) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  it("distingue l'ancre du formulaire de l'identifiant du champ", () => {
    expect(ID_FORMULAIRE_DEMANDE).not.toBe(ID_CHAMP_FORFAIT_SOUHAITE);
  });

  it("aligne la longueur maximale du message sur la validation serveur", () => {
    // `plan-actions.ts` refuse au-delà de 2000 caractères. Un `maxLength` plus
    // large rendrait le refus atteignable depuis le formulaire.
    expect(LONGUEUR_MAX_MESSAGE).toBe(2000);
  });
});
