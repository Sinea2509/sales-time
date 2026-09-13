import { describe, expect, it } from "@jest/globals";
import { getSellerCoachingActionPlan } from "./get-seller-coaching-action-plan";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

/**
 * Ce test garde le câblage, pas le choix des gestes (déjà relu par
 * seller-action-plan.test.ts) : la requête est bien cadrée sur le commercial
 * avec le résultat KISS demandé, et les puces « start » et « improve » de ses
 * rendez-vous ressortent en actions. Un port factice tient lieu de base.
 */

function meetingWithKiss(over: {
  start?: string[];
  improve?: string[];
}): RecentMeetingListRow {
  return {
    latestKissResult: {
      keep: ["Bien cadrer"],
      improve: over.improve ?? [],
      stop: ["Couper la parole"],
      start: over.start ?? [],
      goldenQuestion: "gq",
      coachingScore: 7,
      coachingScoreJustification: "j",
      summary: "s",
    },
  } as RecentMeetingListRow;
}

describe("getSellerCoachingActionPlan", () => {
  it("cadre la requête sur le commercial et demande le résultat KISS", async () => {
    const appels: Array<Record<string, unknown>> = [];
    const deps = {
      meetings: {
        listRecentMeetingsForDashboard: async (
          args: Record<string, unknown>,
        ) => {
          appels.push(args);
          return [
            meetingWithKiss({ start: ["Dater la prochaine étape"] }),
            meetingWithKiss({ improve: ["Chiffrer l'enjeu avant le prix"] }),
          ];
        },
      },
    } as never;

    const plan = await getSellerCoachingActionPlan(deps, {
      organizationId: "org-1",
      statsWindowDays: 30,
      sellerUserId: "u-1",
    });

    expect(appels).toHaveLength(1);
    expect(appels[0]?.sellerUserId).toBe("u-1");
    expect(appels[0]?.includeLatestKissResult).toBe(true);
    expect(plan).toEqual([
      { kind: "start", text: "Dater la prochaine étape" },
      { kind: "improve", text: "Chiffrer l'enjeu avant le prix" },
    ]);
  });

  it("rend un plan vide sans organisation, sans toucher à la base", async () => {
    let touchedBase = false;
    const deps = {
      meetings: {
        listRecentMeetingsForDashboard: async () => {
          touchedBase = true;
          return [];
        },
      },
    } as never;

    const plan = await getSellerCoachingActionPlan(deps, {
      organizationId: null,
      statsWindowDays: 30,
      sellerUserId: "u-1",
    });

    expect(plan).toEqual([]);
    expect(touchedBase).toBe(false);
  });
});
