import { discResultSchema, soncasResultSchema } from "./analysis-result-zod";
import { kissResultSchema } from "./kiss-result-zod";
import type { SoncasDriverKey } from "./org-soncas-team-aggregate";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

export type SalesProfileDimensionKey =
  | "assertivite"
  | "ecouteActive"
  | "capitalSympathie"
  | "argumentation"
  | "objections"
  | "nextSteps";

export type SalesProfileScores = Record<SalesProfileDimensionKey, number>;

export type TeamSalesProfileAggregate = {
  scores: SalesProfileScores | null;
  /** RDV pris en compte (au moins une dimension calculée). */
  rdvCount: number;
};

function averageDefined(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((acc, v) => acc + v, 0) / nums.length);
}

function kissCoachingPercent(raw: unknown): number | null {
  const parsed = kissResultSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.coachingScore * 10;
}

function soncasDriverScore(raw: unknown, key: SoncasDriverKey): number | null {
  const parsed = soncasResultSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.drivers[key].score;
}

function discLetterScore(
  raw: unknown,
  letter: "D" | "I" | "S" | "C",
): number | null {
  const parsed = discResultSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.scores[letter];
}

function kissNextStepsScore(raw: unknown): number | null {
  const parsed = kissResultSchema.safeParse(raw);
  if (!parsed.success) return null;
  const count = Math.min(6, parsed.data.start.length);
  return Math.round((count / 6) * 100);
}

/** Scores 0–100 par RDV, dérivés des analyses SONCAS / DISC / KISS. */
export function salesProfileScoresFromMeeting(
  meeting: Pick<
    RecentMeetingListRow,
    "latestSoncasResult" | "latestDiscResult" | "latestKissResult"
  >,
): Partial<SalesProfileScores> | null {
  const { latestSoncasResult, latestDiscResult, latestKissResult } = meeting;
  const coaching = kissCoachingPercent(latestKissResult);

  const assertivite = averageDefined([
    discLetterScore(latestDiscResult, "D"),
    soncasDriverScore(latestSoncasResult, "orgueil"),
    coaching,
  ]);
  const ecouteActive = averageDefined([
    discLetterScore(latestDiscResult, "S"),
    soncasDriverScore(latestSoncasResult, "confort"),
    coaching,
  ]);
  const capitalSympathie = averageDefined([
    soncasDriverScore(latestSoncasResult, "sympathie"),
    discLetterScore(latestDiscResult, "I"),
    coaching,
  ]);
  const argumentation = averageDefined([
    soncasDriverScore(latestSoncasResult, "argent"),
    discLetterScore(latestDiscResult, "C"),
    soncasDriverScore(latestSoncasResult, "orgueil"),
  ]);
  const objections = averageDefined([
    soncasDriverScore(latestSoncasResult, "securite"),
    coaching,
    soncasDriverScore(latestSoncasResult, "confort"),
  ]);
  const nextSteps = averageDefined([
    kissNextStepsScore(latestKissResult),
    soncasDriverScore(latestSoncasResult, "nouveaute"),
    coaching,
  ]);

  const partial: Partial<SalesProfileScores> = {};
  if (assertivite != null) partial.assertivite = assertivite;
  if (ecouteActive != null) partial.ecouteActive = ecouteActive;
  if (capitalSympathie != null) partial.capitalSympathie = capitalSympathie;
  if (argumentation != null) partial.argumentation = argumentation;
  if (objections != null) partial.objections = objections;
  if (nextSteps != null) partial.nextSteps = nextSteps;

  return Object.keys(partial).length > 0 ? partial : null;
}

/** Moyenne équipe (ou commercial) : chaque dimension = moyenne sur les RDV analysés. */
export function aggregateTeamSalesProfileFromMeetings(
  meetings: RecentMeetingListRow[],
): TeamSalesProfileAggregate {
  const perMeeting = meetings
    .map((m) => salesProfileScoresFromMeeting(m))
    .filter((p): p is Partial<SalesProfileScores> => p != null);

  if (perMeeting.length === 0) {
    return { scores: null, rdvCount: 0 };
  }

  const keys: SalesProfileDimensionKey[] = [
    "assertivite",
    "ecouteActive",
    "capitalSympathie",
    "argumentation",
    "objections",
    "nextSteps",
  ];

  const scores = {} as SalesProfileScores;
  let hasAny = false;
  for (const key of keys) {
    const values = perMeeting
      .map((p) => p[key])
      .filter((v): v is number => v != null);
    if (values.length > 0) {
      scores[key] = Math.round(
        values.reduce((acc, v) => acc + v, 0) / values.length,
      );
      hasAny = true;
    } else {
      scores[key] = 0;
    }
  }

  return {
    scores: hasAny ? scores : null,
    rdvCount: perMeeting.length,
  };
}
