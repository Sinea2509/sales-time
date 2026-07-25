import { describe, expect, it } from "@jest/globals";
import {
  libelleDiscDominant,
  libelleSoncasDominant,
} from "./profil-dominant-libelle";
import {
  DISC_LABEL_FR,
  SONCAS_LABEL_FR,
} from "@/src/core/domain/seller-affinity-from-meetings";

describe("libelleDiscDominant", () => {
  /*
    Le défaut d'origine : le modèle recopie le champ `dominant` de l'analyse
    stockée, et l'écran affichait « DISC D » à un commercial qui prépare son
    rendez-vous.
  */
  it("turns the stored key into the word the seller reads", () => {
    expect(libelleDiscDominant("D")).toBe("Dominant");
    expect(libelleDiscDominant("I")).toBe("Influent");
    expect(libelleDiscDominant("S")).toBe("Stable");
    expect(libelleDiscDominant("C")).toBe("Conforme");
  });

  it("leaves an already correct label untouched", () => {
    for (const libelle of Object.values(DISC_LABEL_FR)) {
      expect(libelleDiscDominant(libelle)).toBe(libelle);
    }
  });

  it("ignores case and surrounding spaces", () => {
    expect(libelleDiscDominant("d")).toBe("Dominant");
    expect(libelleDiscDominant("  influent  ")).toBe("Influent");
    expect(libelleDiscDominant("STABLE")).toBe("Stable");
  });

  it("has nothing to say when there is nothing to say", () => {
    expect(libelleDiscDominant(null)).toBeNull();
    expect(libelleDiscDominant("")).toBeNull();
    expect(libelleDiscDominant("   ")).toBeNull();
  });

  /*
    Un super-administrateur peut réécrire le prompt : une valeur hors
    vocabulaire est donc normale. Elle reste une information sur le prospect,
    et la perdre coûte plus cher que de l'afficher telle quelle.
  */
  it("keeps an unexpected value rather than dropping it", () => {
    expect(libelleDiscDominant("  Analytique  ")).toBe("Analytique");
  });

  it("does not answer with the other vocabulary", () => {
    expect(libelleDiscDominant("securite")).toBe("securite");
  });
});

describe("libelleSoncasDominant", () => {
  it("turns the stored key into the word the seller reads", () => {
    expect(libelleSoncasDominant("securite")).toBe("Sécurité");
    expect(libelleSoncasDominant("nouveaute")).toBe("Nouveauté");
    expect(libelleSoncasDominant("argent")).toBe("Argent");
  });

  /*
    Le modèle écrit tantôt « securite », tantôt « Sécurité » : les deux
    orthographes doivent tomber sur le même mot, sinon le même profil change
    de nom d'un briefing à l'autre.
  */
  it("maps the accented and unaccented spellings to the same word", () => {
    expect(libelleSoncasDominant("Sécurité")).toBe("Sécurité");
    expect(libelleSoncasDominant("securite")).toBe("Sécurité");
    expect(libelleSoncasDominant("SÉCURITÉ")).toBe("Sécurité");
    expect(libelleSoncasDominant("SECURITE")).toBe("Sécurité");
  });

  it("has nothing to say when there is nothing to say", () => {
    expect(libelleSoncasDominant(null)).toBeNull();
    expect(libelleSoncasDominant("")).toBeNull();
  });

  it("keeps an unexpected value rather than dropping it", () => {
    expect(libelleSoncasDominant("Urgence")).toBe("Urgence");
  });

  it("does not answer with the other vocabulary", () => {
    expect(libelleSoncasDominant("D")).toBe("D");
  });
});

describe("le vocabulaire affiché", () => {
  /*
    Garde-fou de vocabulaire : quelle que soit l'orthographe reçue pour une
    valeur connue, l'écran ne doit jamais montrer la forme de la base. Le test
    parcourt les deux dictionnaires plutôt qu'une liste recopiée, pour qu'un
    nouveau levier ajouté au domaine soit couvert sans rien réécrire ici.
  */
  it("never shows a stored key back to the seller", () => {
    for (const [cle, libelle] of Object.entries(DISC_LABEL_FR)) {
      expect(libelleDiscDominant(cle)).toBe(libelle);
      expect(libelleDiscDominant(cle.toLowerCase())).toBe(libelle);
    }
    for (const [cle, libelle] of Object.entries(SONCAS_LABEL_FR)) {
      expect(libelleSoncasDominant(cle)).toBe(libelle);
      expect(libelleSoncasDominant(cle.toUpperCase())).toBe(libelle);
    }
  });

  it("returns words that start with a capital letter", () => {
    const tous = [
      ...Object.keys(DISC_LABEL_FR).map(libelleDiscDominant),
      ...Object.keys(SONCAS_LABEL_FR).map(libelleSoncasDominant),
    ];
    for (const mot of tous) {
      expect(mot).not.toBeNull();
      expect(mot![0]).toBe(mot![0].toUpperCase());
    }
  });
});
