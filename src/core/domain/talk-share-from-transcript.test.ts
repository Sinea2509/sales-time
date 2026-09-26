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
