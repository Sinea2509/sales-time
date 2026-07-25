import {
  ETAPE_NON_RENSEIGNEE,
  meetingEtapeDisplayLabel,
} from "@/src/core/domain/meeting-etape-display";

export type MeetingEtapeSource = {
  meetingType: string | null;
  pipelineStage: string | null;
};

export { ETAPE_NON_RENSEIGNEE, meetingEtapeDisplayLabel };

type EtapeStyle = {
  pillClass: string;
  scatterColor: string;
};

const DEFAULT_ETAPE_STYLE: EtapeStyle = {
  pillClass:
    "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300",
  scatterColor: "#71717a",
};

const PROPOSITION_STYLE: EtapeStyle = {
  pillClass:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/50 dark:text-sky-200",
  scatterColor: "#0ea5e9",
};

const DECOUVERTE_STYLE: EtapeStyle = {
  pillClass:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/50 dark:text-emerald-200",
  scatterColor: "#10b981",
};

const NEGOCIATION_STYLE: EtapeStyle = {
  pillClass:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/50 dark:text-rose-200",
  scatterColor: "#f43f5e",
};

const ABSENT_STYLE: EtapeStyle = {
  pillClass:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-200",
  scatterColor: "#f59e0b",
};

const QUALIFICATION_STYLE: EtapeStyle = {
  pillClass:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/50 dark:text-violet-200",
  scatterColor: "#8b5cf6",
};

function normalizeEtapeLabel(label: string): string {
  return label.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function etapeStyleForLabel(label: string): EtapeStyle {
  // Le cas « non renseigné » reste neutre : une étape absente n'est ni une
  // bonne ni une mauvaise nouvelle, et lui donner une couleur d'étape la
  // ferait entrer dans une progression à laquelle elle n'appartient pas.
  if (label === ETAPE_NON_RENSEIGNEE) return DEFAULT_ETAPE_STYLE;

  const normalized = normalizeEtapeLabel(label);
  if (
    normalized.includes("proposition") ||
    normalized.includes("closing") ||
    normalized.includes("gagne")
  ) {
    return PROPOSITION_STYLE;
  }
  if (
    normalized.includes("decouverte") ||
    normalized.includes("demo") ||
    normalized.includes("demonstration")
  ) {
    return DECOUVERTE_STYLE;
  }
  if (normalized.includes("negociation")) {
    return NEGOCIATION_STYLE;
  }
  if (normalized.includes("absent")) {
    return ABSENT_STYLE;
  }
  if (normalized.includes("qualif")) {
    return QUALIFICATION_STYLE;
  }
  return DEFAULT_ETAPE_STYLE;
}

export function meetingEtapePillClassForLabel(label: string): string {
  return etapeStyleForLabel(label).pillClass;
}

export function meetingEtapeScatterColorForLabel(label: string): string {
  return etapeStyleForLabel(label).scatterColor;
}

export function meetingEtapePillClass(source: MeetingEtapeSource): string {
  return meetingEtapePillClassForLabel(meetingEtapeDisplayLabel(source));
}
