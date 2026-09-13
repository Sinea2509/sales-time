import { discResultSchema, soncasResultSchema } from "./analysis-result-zod";
import {
  averageDiscScores,
  DISC_DIMENSION_KEYS,
  type DiscDimensionKey,
} from "./org-disc-team-aggregate";
import {
  averageSoncasDriverScores,
  SONCAS_DRIVER_KEYS,
  type SoncasDriverKey,
} from "./org-soncas-team-aggregate";
import { normalizeScoresToHundred } from "./normalize-scores-to-hundred";

export type ProfilePieValues<T extends string> = Record<T, number>;

export type TeamProfilePieComputation<T extends string> = {
  analyzedMeetings: number;
  /** `true` quand aucune analyse n'existe : les parts égales sont indicatives. */
  isDefaultEqual: boolean;
  values: ProfilePieValues<T>;
};

function equalValues<T extends string>(keys: readonly T[]): ProfilePieValues<T> {
  return Object.fromEntries(keys.map((k) => [k, 1])) as ProfilePieValues<T>;
}

function valuesFromAverages<T extends string>(
  keys: readonly T[],
  averages: Record<T, number | null>,
): ProfilePieValues<T> {
  return Object.fromEntries(
    keys.map((k) => [k, averages[k] ?? 0]),
  ) as ProfilePieValues<T>;
}

export function computeTeamDiscPie(
  discResults: unknown[],
): TeamProfilePieComputation<DiscDimensionKey> {
  const valid = discResults.filter(
    (raw) => discResultSchema.safeParse(raw).success,
  );

  if (valid.length === 0) {
    return {
      analyzedMeetings: 0,
      isDefaultEqual: true,
      values: normalizeScoresToHundred(
        equalValues(DISC_DIMENSION_KEYS),
      ) as ProfilePieValues<DiscDimensionKey>,
    };
  }

  return {
    analyzedMeetings: valid.length,
    isDefaultEqual: false,
    values: normalizeScoresToHundred(
      valuesFromAverages(DISC_DIMENSION_KEYS, averageDiscScores(valid)),
    ) as ProfilePieValues<DiscDimensionKey>,
  };
}

export function computeTeamSoncasPie(
  soncasResults: unknown[],
): TeamProfilePieComputation<SoncasDriverKey> {
  const valid = soncasResults.filter(
    (raw) => soncasResultSchema.safeParse(raw).success,
  );

  if (valid.length === 0) {
    return {
      analyzedMeetings: 0,
      isDefaultEqual: true,
      values: normalizeScoresToHundred(
        equalValues(SONCAS_DRIVER_KEYS),
      ) as ProfilePieValues<SoncasDriverKey>,
    };
  }

  return {
    analyzedMeetings: valid.length,
    isDefaultEqual: false,
    values: normalizeScoresToHundred(
      valuesFromAverages(SONCAS_DRIVER_KEYS, averageSoncasDriverScores(valid)),
    ) as ProfilePieValues<SoncasDriverKey>,
  };
}
