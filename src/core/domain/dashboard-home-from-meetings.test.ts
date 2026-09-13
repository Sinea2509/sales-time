import { describe, expect, it } from "@jest/globals";
import {
  dashboardHomeFromMeetings,
  type DashboardHomeMeeting,
} from "./dashboard-home-from-meetings";

function rdv(
  durationMin: number | null,
  salesScore: number | null = null,
): DashboardHomeMeeting {
  return { durationMin, salesScore };
}

/**
 * Ce que ces cas vérifient : l'arithmétique des chiffres de tête, sur les deux
 * fenêtres, y compris quand une fenêtre est vide.
 *
 * Ce qu'ils ne vérifient pas : le cadrage. La fonction reçoit deux listes déjà
 * filtrées par période et par population, et les compte telles quelles ; le
 * choix de ce qu'on lui donne se juge chez ses appelants.
 */
describe("dashboardHomeFromMeetings", () => {
  const base = {
    statsWindowDays: 30 as const,
    tamMinutesPerRdv: 50,
    prospectingMinutes: 240,
  };

  it("compte tous les RDV, et ne mesure la durée que sur ceux qui en portent une", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [rdv(30), rdv(90), rdv(null)],
      previous: [],
    });

    expect(out.nbRdvs).toBe(3);
    expect(out.nbRdvsRenseignes).toBe(2);
    expect(out.usefulConversationMinutes).toBe(120);
    expect(out.avgDurationMin).toBe(60);
  });

  it("compte le TAM cumulé comme un gain par RDV renseigné, pas comme un temps de conversation", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [rdv(30), rdv(90), rdv(null)],
      previous: [],
    });

    // 50 min de gain administratif sur 2 RDV renseignés. Les 120 minutes de
    // conversation de ces mêmes RDV sont l'autre chiffre, celui que ce champ
    // portait autrefois par erreur.
    expect(out.tamCumuleMinutes).toBe(100);
    expect(out.tamCumuleMinutes).not.toBe(out.usefulConversationMinutes);
  });

  it("rapporte la conversation utile au temps de prospection visé", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [rdv(30), rdv(90)],
      previous: [],
    });

    expect(out.tucOptimisePercent).toBe(50);
  });

  it("ne calcule pas de TUC quand aucun temps de prospection n'est fixé", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      prospectingMinutes: 0,
      current: [rdv(30)],
      previous: [rdv(30)],
    });

    expect(out.tucOptimisePercent).toBeNull();
    expect(out.tucTrendPoints).toBeNull();
  });

  it("convertit les SalesScore de la fenêtre en note sur 5", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [rdv(30, 80), rdv(90, 60), rdv(null)],
      previous: [],
    });

    expect(out.noteGlobaleOn5).toBe(3.5);
    expect(out.noteGlobaleSampleCount).toBe(2);
  });

  it("compare chaque chiffre à la fenêtre précédente", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [rdv(30, 80), rdv(90, 60), rdv(null)],
      previous: [rdv(60, 40)],
    });

    expect(out.nbRdvsTrendPercent).toBe(200);
    expect(out.nbRdvsRenseignesTrendPercent).toBe(100);
    expect(out.tamCumuleTrendPercent).toBe(100);
    expect(out.tamTrendPercent).toBe(0);
    expect(out.tucTrendPoints).toBe(25);
    expect(out.noteGlobaleTrendPoints).toBe(1.5);
    expect(out.noteGlobaleTrendPercent).toBe(75);
    // Le même mouvement, lu sur 100 par le commercial : 70 contre 40.
    expect(out.salesScoreAvg).toBe(70);
    expect(out.salesScoreTrendPoints).toBe(30);
  });

  it("n'annonce aucune variation quand la fenêtre précédente est vide", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [rdv(30, 80)],
      previous: [],
    });

    expect(out.nbRdvsTrendPercent).toBeNull();
    expect(out.nbRdvsRenseignesTrendPercent).toBeNull();
    expect(out.tamCumuleTrendPercent).toBeNull();
    expect(out.tamTrendPercent).toBeNull();
    expect(out.noteGlobaleTrendPoints).toBeNull();
    expect(out.noteGlobaleTrendPercent).toBeNull();
    expect(out.salesScoreTrendPoints).toBeNull();
  });

  it("tient sur deux fenêtres vides sans rien inventer", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [],
      previous: [],
    });

    expect(out.nbRdvs).toBe(0);
    expect(out.nbRdvsRenseignes).toBe(0);
    expect(out.usefulConversationMinutes).toBe(0);
    expect(out.tamCumuleMinutes).toBe(0);
    expect(out.avgDurationMin).toBeNull();
    expect(out.noteGlobaleOn5).toBeNull();
    expect(out.noteGlobaleSampleCount).toBe(0);
    expect(out.nbRdvsTrendPercent).toBeNull();
  });

  it("rend tels quels la fenêtre et les deux paramètres d'organisation", () => {
    const out = dashboardHomeFromMeetings({
      ...base,
      current: [],
      previous: [],
    });

    expect(out.statsWindowDays).toBe(30);
    expect(out.tamMinutesPerRdv).toBe(50);
    expect(out.prospectingMinutes).toBe(240);
  });
});
