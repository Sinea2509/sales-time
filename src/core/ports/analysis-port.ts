import type {
  DiscAnalysisResult,
  KissAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { FollowUpEmailResult } from "@/src/core/domain/follow-up-email-zod";

/** Agrégats KISS équipe (tableau de bord admin) pour synthèse texte. */
export type OrgKissRollupForSummary = {
  kissMeetingsCount: number;
  keepBullets: number;
  improveBullets: number;
  stopBullets: number;
  startBullets: number;
};

export interface AnalysisPort {
  analyzeSoncas(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: SoncasAnalysisResult; rawText?: string }>;

  analyzeDisc(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: DiscAnalysisResult; rawText?: string }>;

  analyzeKiss(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
    /** Latest SONCAS / DISC structured results for this meeting, when already analyzed. */
    priorSoncasResult?: unknown;
    priorDiscResult?: unknown;
  }): Promise<{ result: KissAnalysisResult; rawText?: string }>;

  generateFollowUpEmail(input: {
    systemMarkdown: string;
    userContent: string;
    model: string;
  }): Promise<{ result: FollowUpEmailResult; rawText?: string }>;

  /** Un paragraphe court (axes d’amélioration d’équipe) à partir des totaux KISS agrégés. */
  summarizeOrgKissRollup(input: {
    rollup: OrgKissRollupForSummary;
    model: string;
  }): Promise<string>;
}
