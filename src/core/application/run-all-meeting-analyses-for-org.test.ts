import { runAllMeetingAnalysesForOrg } from "./run-all-meeting-analyses-for-org";
import { runMeetingAnalysis } from "./run-meeting-analysis";

jest.mock("./run-meeting-analysis", () => ({
  runMeetingAnalysis: jest.fn(),
}));

const runMeetingAnalysisMock = runMeetingAnalysis as jest.MockedFunction<
  typeof runMeetingAnalysis
>;

function makeDeps() {
  return {
    meetings: {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue({
        id: "m1",
        organizationId: "org1",
        personId: "p1",
        prospectName: "Alice",
        sellerUserId: "u1",
      }),
      updateMeetingStatus: jest.fn().mockResolvedValue(true),
      updateMeetingVisitReportDraft: jest.fn().mockResolvedValue(true),
      findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
      findMeetingDetailWithAnalyses: jest.fn().mockResolvedValue(null),
      updatePersonProfileCache: jest.fn().mockResolvedValue(undefined),
    },
    prompts: {},
    analysis: {},
    globalKissCoachingPrompts: {
      getPrompts: jest.fn().mockResolvedValue(null),
    },
    notifications: {
      create: jest.fn().mockResolvedValue(undefined),
    },
    users: {
      findEmailById: jest.fn().mockResolvedValue(null),
    },
  };
}

describe("runAllMeetingAnalysesForOrg", () => {
  beforeEach(() => {
    runMeetingAnalysisMock.mockReset();
  });

  /*
    L'ordre est vérifié, pas seulement le nombre. KISS relit les résultats SONCAS
    et DISC déjà enregistrés : les lancer dans le désordre lui ferait analyser un
    rendez-vous dont le profil d'interlocuteur n'existe pas encore. La scorecard
    part avec les deux profils, elle ne nourrit aucune des autres.
  */
  it("runs SONCAS, DISC and SCORECARD, then KISS, and marks meeting READY", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({ ok: true });
    expect(runMeetingAnalysisMock.mock.calls.map((c) => c[1].kind)).toEqual([
      "SONCAS",
      "DISC",
      "SCORECARD",
      "KISS",
    ]);
    expect(deps.meetings.updateMeetingStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "READY" }),
    );
  });

  /*
    Le contrat des deux vagues, tenu par le temps et non par l'ordre des
    appels : KISS ne doit pas seulement être appelé après les trois autres, il
    doit l'être une fois qu'ils ont tous rendu leur résultat. Un `await` oublié
    devant la première vague garderait l'ordre des appels et casserait cela.
  */
  it("ne lance KISS qu'une fois SONCAS, DISC et la scorecard terminés", async () => {
    const settled = new Set<string>();
    let kindsSettledWhenKissStarted: string[] | null = null;

    runMeetingAnalysisMock.mockImplementation(async (_deps, input) => {
      if (input.kind === "KISS") {
        kindsSettledWhenKissStarted = [...settled].sort();
        return { ok: true, analysisId: "kiss" };
      }
      await new Promise((resolve) =>
        setTimeout(resolve, input.kind === "DISC" ? 30 : 5),
      );
      settled.add(input.kind);
      return { ok: true, analysisId: input.kind };
    });

    await runAllMeetingAnalysesForOrg(makeDeps() as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(kindsSettledWhenKissStarted).toEqual([
      "DISC",
      "SCORECARD",
      "SONCAS",
    ]);
  });

  /*
    Le cas qui justifie la sortie séparée de `NO_SCORECARD_GRID`. Aujourd'hui
    seule la découverte a une grille : tous les autres rendez-vous passent par
    là. Si l'absence de grille comptait comme un échec, brancher la scorecard
    ferait basculer en FAILED la majorité des rendez-vous du produit, alors que
    leurs trois analyses viennent de réussir.
  */
  it("termine en READY quand le RDV n'a pas de grille de scorecard", async () => {
    runMeetingAnalysisMock.mockImplementation(async (_deps, input) =>
      input.kind === "SCORECARD"
        ? { ok: false, error: "NO_SCORECARD_GRID" }
        : { ok: true, analysisId: input.kind },
    );
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({ ok: true });
    expect(deps.meetings.updateMeetingStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "READY" }),
    );
  });

  /*
    Sauter une étape, et non arrêter la séquence.

    L'absence de grille arrive au milieu de la première vague, et non à sa
    fin : « passer à la suivante » et « sortir de la boucle » n'y produisent pas
    le même résultat. Le cas est donc forcé depuis la première étape, seul
    endroit d'où la différence se voit sur les deux suivantes. Ce n'est pas un
    état que la production produit, c'est le contrat du dépouillement.
  */
  it("saute l'étape sans grille sans arrêter les suivantes", async () => {
    runMeetingAnalysisMock.mockImplementation(async (_deps, input) =>
      input.kind === "SONCAS"
        ? { ok: false, error: "NO_SCORECARD_GRID" }
        : { ok: true, analysisId: input.kind },
    );
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({ ok: true });
    expect(runMeetingAnalysisMock.mock.calls.map((c) => c[1].kind)).toEqual([
      "SONCAS",
      "DISC",
      "SCORECARD",
      "KISS",
    ]);
  });

  /*
    L'indulgence s'arrête là : une grille existe, le modèle a échoué. C'est un
    incident, et il se dit comme les autres. KISS n'est alors jamais lancé :
    un coaching sur un rendez-vous marqué en échec serait un coaching que
    personne ne lira.
  */
  it("marque FAILED quand la scorecard échoue vraiment, sans lancer KISS", async () => {
    runMeetingAnalysisMock.mockImplementation(async (_deps, input) =>
      input.kind === "SCORECARD"
        ? {
            ok: false,
            error: "ANALYSIS_FAILED",
            message: "grille notée à moitié",
          }
        : { ok: true, analysisId: input.kind },
    );
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "grille notée à moitié",
      failedKind: "SCORECARD",
    });
    expect(
      runMeetingAnalysisMock.mock.calls.map((c) => c[1].kind),
    ).not.toContain("KISS");
    expect(deps.meetings.updateMeetingStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "FAILED" }),
    );
  });

  /*
    Deux échecs dans la même vague : le rendez-vous nomme celui qui vient en
    premier dans la liste, toujours le même, pour que deux relances du même
    incident racontent la même histoire.
  */
  it("nomme la première étape fautive de la liste quand deux échouent ensemble", async () => {
    runMeetingAnalysisMock.mockImplementation(async (_deps, input) =>
      input.kind === "SONCAS"
        ? { ok: true, analysisId: "soncas" }
        : { ok: false, error: "ANALYSIS_FAILED", message: `${input.kind} KO` },
    );

    const result = await runAllMeetingAnalysesForOrg(makeDeps() as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "DISC KO",
      failedKind: "DISC",
    });
  });

  /*
    Les consignes KISS de la plateforme définissent les six notes du commercial
    et le `coachingScore`, deux champs absents du schéma de la scorecard. Elles
    partent pour KISS et pour KISS seule ; l'orchestrateur le vérifie de son
    côté, ce test tient l'aiguillage fait ici.
  */
  it("ne donne l'annexe KISS qu'à l'analyse KISS", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });
    const deps = makeDeps();

    await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    for (const call of runMeetingAnalysisMock.mock.calls) {
      if (call[1].kind === "KISS") continue;
      expect([call[1].kind, call[1].kissSystemMarkdownAppendix]).toEqual([
        call[1].kind,
        undefined,
      ]);
    }
  });

  it("marks meeting FAILED when an analysis step fails", async () => {
    runMeetingAnalysisMock.mockImplementation(async (_deps, input) =>
      input.kind === "DISC"
        ? { ok: false, error: "ANALYSIS_FAILED", message: "boom" }
        : { ok: true, analysisId: input.kind },
    );
    const deps = makeDeps();

    const result = await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result.ok).toBe(false);
    expect(deps.meetings.updateMeetingStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "FAILED", errorMessage: "boom" }),
    );
  });

  it("lit le playbook une seule fois et le donne a toute la sequence", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });
    const findByOrganizationId = jest.fn().mockResolvedValue({
      companyName: "Acme",
      playbook: { offer: "Formation commerciale" },
    });
    const deps = {
      ...makeDeps(),
      organizationSettings: { findByOrganizationId },
    };

    await runAllMeetingAnalysesForOrg(deps as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    /*
      Une seule lecture pour toute la séquence : une modification du playbook
      en cours de séquence ne doit pas faire juger le même RDV sur deux
      contextes différents.
    */
    expect(findByOrganizationId).toHaveBeenCalledTimes(1);
    expect(findByOrganizationId).toHaveBeenCalledWith("org1");
    for (const call of runMeetingAnalysisMock.mock.calls) {
      const markdown = call[1].organizationPlaybookMarkdown ?? "";
      expect(markdown).toContain("## Playbook de l'organisation");
      expect(markdown).toContain("Formation commerciale");
      expect(markdown).toContain("Acme");
    }
  });

  it("tourne sans playbook quand le port des réglages est absent", async () => {
    runMeetingAnalysisMock.mockResolvedValue({ ok: true, analysisId: "a1" });

    const result = await runAllMeetingAnalysesForOrg(makeDeps() as never, {
      organizationId: "org1",
      meetingId: "m1",
      notifyOnComplete: false,
    });

    expect(result).toEqual({ ok: true });
    for (const call of runMeetingAnalysisMock.mock.calls) {
      expect(call[1].organizationPlaybookMarkdown).toBeNull();
    }
  });
});
