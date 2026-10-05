import { talkShareFromTranscript } from "./talk-share-from-transcript";

describe("talkShareFromTranscript", () => {
  it("ne dit rien d'un transcript sans intervenants", () => {
    expect(
      talkShareFromTranscript(
        "Bonjour, nous avons parlé du budget et des délais.",
      ),
    ).toBeNull();
  });

  it("reconnaît les rôles à leur nom et compte les mots", () => {
    const share = talkShareFromTranscript(
      [
        "Commercial : bonjour merci de me recevoir aujourd'hui",
        "Prospect : bonjour",
        "Commercial : je vous propose trois points",
        "Prospect : très bien allons-y sur le premier point qui me préoccupe",
      ].join("\n"),
    );

    expect(share).not.toBeNull();
    expect(share?.rolesRecognized).toBe(true);
    expect(share?.commercialLabel).toBe("Commercial");
    /* 12 mots pour le commercial, 12 pour le prospect. */
    expect(share?.commercialPct).toBe(50);
    expect(share?.longestCommercialRunWords).toBe(6);
  });

  it("devine le commercial comme premier à parler quand les noms sont des prénoms", () => {
    const share = talkShareFromTranscript(
      ["Camille : bonjour Hélène", "Hélène : bonjour Camille ravie"].join("\n"),
    );

    expect(share?.rolesRecognized).toBe(false);
    expect(share?.commercialLabel).toBe("Camille");
    expect(share?.prospectLabel).toBe("Hélène");
  });

  it("rattache une ligne sans nom à la réplique précédente", () => {
    const share = talkShareFromTranscript(
      [
        "Commercial : première phrase de la réplique",
        "et la suite de la même réplique sur une autre ligne",
        "Client : réponse courte",
      ].join("\n"),
    );

    expect(share?.longestCommercialRunWords).toBe(16);
  });

  it("refuse un transcript dont trop de lignes sont sans intervenant", () => {
    const share = talkShareFromTranscript(
      [
        "Un long préambule sans intervenant qui pèse beaucoup de mots dans le texte total",
        "et qui continue encore et encore sans nommer personne du tout ici",
        "Commercial : bonjour",
      ].join("\n"),
    );
    expect(share).toBeNull();
  });
});

describe("talkShareFromTranscript, transcripts réels", () => {
  const teams = [
    "RDV Formations-20260929_150945-Transcription de la réunion",
    "29 septembre 2026, 01:09PM",
    "54min 42sec",
    "",
    "Cédric Laigneau a commencé la transcription",
    "",
    "Lisa ANDROLUS   0:03",
    "Je suis dans.",
    "",
    "Cédric Laigneau   0:04",
    "Ok, super. Pouvez-vous me décrire votre équipe ?",
    "",
    "Lisa ANDROLUS   0:06",
    "Je suis plutôt en charge de la partie plan de développement des compétences.",
    "",
    "Cédric Laigneau   1:10",
    "Combien de managers sont concernés ? Et sur quels sites ?",
    "Il y a 2 options : soit un parcours, soit des sessions.",
    "",
    "Lisa ANDROLUS   1:30",
    "Une quarantaine.",
    "",
    "Cédric Laigneau   1:34",
    "D'accord.",
  ].join("\n");

  it("lit le format Teams : le nom et l'horodatage, puis la réplique en dessous", () => {
    const share = talkShareFromTranscript(teams);
    expect(share).not.toBeNull();
    expect(share?.commercialLabel).toBe("Cédric Laigneau");
    expect(share?.prospectLabel).toBe("Lisa ANDROLUS");
    expect(share?.rolesBasis).toBe("organizer");
    /* 31 mots pour Cédric (dont la ligne « 2 options : »), 18 pour Lisa. */
    expect(share?.commercialPct).toBe(64);
  });

  it("ne prend ni l'horodatage pour un nom, ni « 2 options : » pour un intervenant", () => {
    const share = talkShareFromTranscript(teams);
    expect(share?.commercialLabel).not.toMatch(/\d/);
    expect(share?.prospectLabel).not.toMatch(/\d|options/);
  });

  it("reconnaît le commercial à son nom quand le produit le connaît", () => {
    const share = talkShareFromTranscript(
      teams.replace("Cédric Laigneau a commencé la transcription", ""),
      { sellerName: "Cédric Laigneau" },
    );
    expect(share?.commercialLabel).toBe("Cédric Laigneau");
    expect(share?.rolesBasis).toBe("names");
  });

  it("ignore une ligne « Participants : » et retrouve le commercial par le nom du prospect", () => {
    const share = talkShareFromTranscript(
      [
        "Transcript fictif, pour tester Sales Time.",
        "Participants : Julien Arnaud (commercial), Claire Morel (directrice commerciale).",
        "",
        "Julien : Bonjour Claire, merci de me recevoir.",
        "Claire : Oui, allons-y. Je n'ai pas beaucoup de temps.",
        "Julien : Pouvez-vous me décrire votre équipe commerciale ?",
        "Claire : Nous sommes neuf commerciaux terrain sur quatre secteurs.",
      ].join("\n"),
      { prospectNames: ["Claire Morel"] },
    );
    expect(share?.commercialLabel).toBe("Julien");
    expect(share?.prospectLabel).toBe("Claire");
    expect(share?.rolesBasis).toBe("names");
  });

  it("compte tout le côté client quand plusieurs personnes y parlent", () => {
    const share = talkShareFromTranscript(
      [
        "Commercial : bonjour à vous deux",
        "Lisa : bonjour",
        "Sandrine : bonjour",
        "Commercial : on commence",
        "Lisa : oui",
        "Sandrine : allons-y",
      ].join("\n"),
    );
    expect(share?.commercialLabel).toBe("Commercial");
    expect(share?.prospectLabel).toMatch(/et 1 autre$/);
    /* 6 mots pour le commercial, 4 pour les deux autres. */
    expect(share?.commercialPct).toBe(60);
  });
});
