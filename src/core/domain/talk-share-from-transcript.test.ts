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

  /*
    Le format d'un export de visioconférence : une date en tête, puis pour
    chaque réplique le nom suivi de l'heure sur une ligne, et le texte sur la
    suivante. Ni la date ni l'heure ne sont des intervenants.
  */
  it("lit un export de réunion où le nom est suivi de l'heure", () => {
    const share = talkShareFromTranscript(
      [
        "16 septembre 2026, 09:14",
        "",
        "Perrine Durand 7:32",
        "Bonjour à tous merci d'être là ce matin pour ce point",
        "Hélène Vasseur 7:40",
        "Bonjour",
        "Perrine Durand 7:45",
        "Je vous propose de commencer par votre organisation actuelle",
      ].join("\n"),
      { sellerName: "Perrine Durand", prospectName: "Hélène Vasseur" },
    );

    expect(share).not.toBeNull();
    expect(share?.rolesRecognized).toBe(true);
    expect(share?.commercialLabel).toBe("Perrine Durand");
    expect(share?.prospectLabel).toBe("Hélène Vasseur");
    /* 11 + 10 mots pour Perrine, 1 pour Hélène. */
    expect(share?.commercialPct).toBe(95);
  });

  it("ignore les horodatages en tête de réplique et les repères de sous-titres", () => {
    const share = talkShareFromTranscript(
      [
        "1",
        "00:00:01,000 --> 00:00:04,000",
        "[00:00:01] Commercial : bonjour et merci",
        "2",
        "00:00:05,000 --> 00:00:09,000",
        "Client (00:00:05) : bonjour à vous aussi merci",
      ].join("\n"),
    );

    expect(share?.commercialLabel).toBe("Commercial");
    expect(share?.prospectLabel).toBe("Client");
    /* 3 mots contre 5. */
    expect(share?.commercialPct).toBe(38);
  });

  it("reconnaît le commercial à son nom quand aucun rôle n'est écrit", () => {
    const share = talkShareFromTranscript(
      [
        "Hélène : bonjour Camille merci de venir",
        "Camille Roussel : bonjour Hélène",
      ].join("\n"),
      { sellerName: "Camille Roussel" },
    );

    expect(share?.rolesRecognized).toBe(true);
    expect(share?.commercialLabel).toBe("Camille Roussel");
  });
});
