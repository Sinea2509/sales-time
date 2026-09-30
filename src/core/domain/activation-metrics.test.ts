import { activationMetrics } from "./activation-metrics";

const t = (iso: string) => new Date(iso);

describe("activationMetrics", () => {
  it("sans inscrit, rien n'est calculable", () => {
    expect(activationMetrics({ signups: [], firstMeetings: [] })).toEqual({
      signups: 0,
      activated: 0,
      activationRatePct: null,
      medianHoursToFirstMeeting: null,
    });
  });

  it("compte les inscrits qui ont analysé et le délai médian", () => {
    const result = activationMetrics({
      signups: [
        { userId: "a", createdAt: t("2026-09-01T09:00:00Z") },
        { userId: "b", createdAt: t("2026-09-02T09:00:00Z") },
        { userId: "c", createdAt: t("2026-09-03T09:00:00Z") },
        { userId: "d", createdAt: t("2026-09-04T09:00:00Z") },
      ],
      firstMeetings: [
        { userId: "a", at: t("2026-09-01T10:30:00Z") },
        { userId: "b", at: t("2026-09-02T09:30:00Z") },
        { userId: "c", at: t("2026-09-20T09:00:00Z") },
      ],
    });

    expect(result.signups).toBe(4);
    expect(result.activated).toBe(3);
    expect(result.activationRatePct).toBe(75);
    /*
      Délais : 1,5 h, 0,5 h et 408 h. La médiane est 1,5 h, arrondie à 2 : un
      seul retardataire ne fait pas croire que l'activation prend une semaine.
    */
    expect(result.medianHoursToFirstMeeting).toBe(2);
  });

  it("ignore les rendez-vous d'utilisateurs hors période", () => {
    const result = activationMetrics({
      signups: [{ userId: "a", createdAt: t("2026-09-01T09:00:00Z") }],
      firstMeetings: [{ userId: "zz", at: t("2026-09-01T10:00:00Z") }],
    });

    expect(result.activated).toBe(0);
    expect(result.activationRatePct).toBe(0);
    expect(result.medianHoursToFirstMeeting).toBeNull();
  });

  it("ne rend jamais un délai négatif quand une donnée est antérieure à l'inscription", () => {
    const result = activationMetrics({
      signups: [{ userId: "a", createdAt: t("2026-09-05T09:00:00Z") }],
      firstMeetings: [{ userId: "a", at: t("2026-09-01T10:00:00Z") }],
    });

    expect(result.medianHoursToFirstMeeting).toBe(0);
  });
});
