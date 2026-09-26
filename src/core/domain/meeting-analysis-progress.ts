import type { MeetingStatus } from "./meeting-status";

/**
 * Les étapes que la fiche rendez-vous montre pendant l'analyse automatique.
 *
 * Elles suivent l'ordre réel du traitement : SONCAS, DISC, la scorecard et
 * les objections partent ensemble, KISS attend les deux profils. Le compte rendu de visite
 * n'en fait pas partie : il s'écrit à la demande, au fil de l'eau, quand on
 * ouvre la fiche une fois l'analyse prête. La liste s'affiche dans cet ordre
 * pour que le commercial voie les cases se cocher dans le sens où elles se
 * remplissent, pas dans un ordre décoratif.
 */
export type AnalysisProgressStepKey =
  | "SONCAS"
  | "DISC"
  | "SCORECARD"
  | "OBJECTIONS"
  | "KISS";

export type AnalysisProgressStepState = "done" | "running" | "pending";

export type AnalysisProgressStep = {
  key: AnalysisProgressStepKey;
  label: string;
  state: AnalysisProgressStepState;
};

export type MeetingAnalysisProgress = {
  steps: AnalysisProgressStep[];
  doneCount: number;
  runningCount: number;
  totalCount: number;
  /** 0 à 100, arrondi, sur les seules étapes terminées. */
  percent: number;
};

const STEP_LABELS: Readonly<Record<AnalysisProgressStepKey, string>> = {
  SONCAS: "Profil SONCAS",
  DISC: "Profil DISC",
  SCORECARD: "Scorecard",
  OBJECTIONS: "Objections",
  KISS: "Coaching KISS",
};

/** Les étapes lancées ensemble, avant KISS. */
const FIRST_WAVE: ReadonlySet<AnalysisProgressStepKey> = new Set([
  "SONCAS",
  "DISC",
  "SCORECARD",
  "OBJECTIONS",
]);

/**
 * Marge entre le passage en PROCESSING et la première analyse écrite.
 *
 * Une relance garde les anciennes analyses en base jusqu'à ce que les
 * nouvelles les remplacent. Sans cette règle, la fiche cocherait toutes les
 * étapes à la seconde où l'on relance, puis les décocherait : une analyse ne
 * compte comme faite que si elle est née après le début de ce traitement.
 */
const FRESHNESS_TOLERANCE_MS = 2_000;

function isFreshForThisRun(input: {
  status: MeetingStatus;
  updatedAt: Date;
  createdAt: Date | undefined;
}): boolean {
  if (input.status !== "PROCESSING") return true;
  if (!input.createdAt) return true;
  return (
    input.createdAt.getTime() >=
    input.updatedAt.getTime() - FRESHNESS_TOLERANCE_MS
  );
}

export function meetingAnalysisProgress(input: {
  status: MeetingStatus;
  updatedAt: Date;
  analyses: ReadonlyArray<{ kind: string; createdAt?: Date }>;
  /** Faux quand le type de rendez-vous n'a pas de grille : l'étape n'est pas listée. */
  scorecardApplicable: boolean;
}): MeetingAnalysisProgress {
  const keys: AnalysisProgressStepKey[] = input.scorecardApplicable
    ? ["SONCAS", "DISC", "SCORECARD", "OBJECTIONS", "KISS"]
    : ["SONCAS", "DISC", "OBJECTIONS", "KISS"];

  const freshKinds = new Set(
    input.analyses
      .filter((a) =>
        isFreshForThisRun({
          status: input.status,
          updatedAt: input.updatedAt,
          createdAt: a.createdAt,
        }),
      )
      .map((a) => a.kind),
  );

  const done = new Set<AnalysisProgressStepKey>();
  for (const key of keys) {
    if (input.status === "READY" || freshKinds.has(key)) {
      done.add(key);
    }
  }

  const running = new Set<AnalysisProgressStepKey>();
  if (input.status === "PROCESSING") {
    const firstWavePending = keys.filter(
      (k) => FIRST_WAVE.has(k) && !done.has(k),
    );
    if (firstWavePending.length > 0) {
      for (const k of firstWavePending) running.add(k);
    } else if (!done.has("KISS")) {
      running.add("KISS");
    }
  }

  const steps = keys.map((key) => ({
    key,
    label: STEP_LABELS[key],
    state: done.has(key)
      ? ("done" as const)
      : running.has(key)
        ? ("running" as const)
        : ("pending" as const),
  }));

  const totalCount = keys.length;
  const doneCount = done.size;
  return {
    steps,
    doneCount,
    runningCount: running.size,
    totalCount,
    percent: Math.round((doneCount / totalCount) * 100),
  };
}
