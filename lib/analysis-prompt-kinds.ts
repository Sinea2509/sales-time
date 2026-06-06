import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

export const MEETING_ANALYSIS_PROMPT_KINDS = [
  "SONCAS",
  "DISC",
  "KISS",
] as const satisfies readonly AnalysisKindSlug[];

export const SYNTHESIS_PROMPT_KINDS = [
  "ORG_KISS_ROLLUP",
  "SELLER_PERFORMANCE",
  "SELLER_AFFINITY",
  "TEAM_COACHING",
] as const satisfies readonly AnalysisKindSlug[];

export const OTHER_PROMPT_KINDS = [
  "FOLLOW_UP_EMAIL",
  "MEETING_BRIEFING",
] as const satisfies readonly AnalysisKindSlug[];

export const ALL_ANALYSIS_PROMPT_KINDS = [
  ...MEETING_ANALYSIS_PROMPT_KINDS,
  ...SYNTHESIS_PROMPT_KINDS,
  ...OTHER_PROMPT_KINDS,
] as const satisfies readonly AnalysisKindSlug[];

export type AnalysisPromptTabMeta = {
  kind: AnalysisKindSlug;
  label: string;
  description: string;
};

export const ANALYSIS_PROMPT_TAB_META: Record<
  AnalysisKindSlug,
  Omit<AnalysisPromptTabMeta, "kind">
> = {
  SONCAS: {
    label: "SONCAS",
    description: "Analyse des leviers d'achat prospect sur chaque RDV.",
  },
  DISC: {
    label: "DISC",
    description: "Analyse du style comportemental prospect sur chaque RDV.",
  },
  KISS: {
    label: "KISS",
    description: "Coaching Keep / Improve / Stop / Start sur chaque RDV.",
  },
  ORG_KISS_ROLLUP: {
    label: "Synthèse KISS équipe",
    description:
      "Paragraphe manager sur le tableau de bord (agrégats KISS équipe).",
  },
  SELLER_PERFORMANCE: {
    label: "Fiche commercial",
    description:
      "Forces, axes d'amélioration et pratiques à arrêter (vue manager).",
  },
  SELLER_AFFINITY: {
    label: "Affinité relationnelle",
    description: "Synthèses DISC et SONCAS pour un commercial (vue manager).",
  },
  TEAM_COACHING: {
    label: "Coaching performance",
    description:
      "Puces progrès et axes d'amélioration sur la page Performance.",
  },
  FOLLOW_UP_EMAIL: {
    label: "Email de suivi",
    description: "Génération d'email post-RDV au prospect.",
  },
  MEETING_BRIEFING: {
    label: "Briefing RDV",
    description: "Préparation du prochain rendez-vous (Préparer un RDV).",
  },
};

export const ANALYSIS_PROMPT_SECTIONS: {
  label: string;
  kinds: readonly AnalysisKindSlug[];
}[] = [
  { label: "Analyses RDV", kinds: MEETING_ANALYSIS_PROMPT_KINDS },
  { label: "Synthèses manager", kinds: SYNTHESIS_PROMPT_KINDS },
  { label: "Autres", kinds: OTHER_PROMPT_KINDS },
];
