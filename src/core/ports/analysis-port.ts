import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { FollowUpEmailResult } from "@/src/core/domain/follow-up-email-zod";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type { SalesProfileScores } from "@/src/core/domain/sales-profile-from-meetings";
import type { TeamCoachingRecommendations } from "@/src/core/domain/team-coaching-recommendations-zod";

/** Agrégats KISS équipe (tableau de bord admin) pour synthèse texte. */
export type OrgKissRollupForSummary = {
  kissMeetingsCount: number;
  keepBullets: string[];
  improveBullets: string[];
  stopBullets: string[];
  startBullets: string[];
};

/** Un RDV digesté pour la synthèse profil (extraits + JSON d’analyses). */
export type SellerCommercialMeetingDigestForSummary = {
  prospectName: string;
  meetingAt: string;
  meetingType: string | null;
  transcriptExcerpt: string;
  soncasResult?: unknown;
  discResult?: unknown;
  kissResult?: unknown;
};

export type SellerCommercialPerformanceSummary = {
  forces: string;
  axesAmelioration: string;
  aStopper: string;
};

/** Synthèses d’affinité relationnelle (angles DISC vs SONCAS) pour un commercial. */
export type SellerRelationalAffinitySummary = {
  discAffinity: string;
  soncasAffinity: string;
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
    systemMarkdown: string;
    rollup: OrgKissRollupForSummary;
    model: string;
  }): Promise<string>;

  /**
   * Synthèses manager pour un commercial : forces, axes d’amélioration, pratiques à arrêter,
   * à partir d’extraits de transcriptions et d’analyses SONCAS/DISC/KISS déjà produites.
   */
  summarizeSellerCommercialPerformance(input: {
    systemMarkdown: string;
    sellerDisplayName: string;
    meetings: SellerCommercialMeetingDigestForSummary[];
    model: string;
  }): Promise<SellerCommercialPerformanceSummary>;

  /**
   * Deux paragraphes : lecture relationnelle via les profils DISC observés sur les RDV,
   * puis via les leviers SONCAS — à partir des transcriptions et des JSON d’analyse déjà produits.
   */
  summarizeSellerRelationalAffinity(input: {
    systemMarkdown: string;
    sellerDisplayName: string;
    meetings: SellerCommercialMeetingDigestForSummary[];
    model: string;
  }): Promise<SellerRelationalAffinitySummary>;

  prepareMeetingBriefing(input: {
    systemMarkdown: string;
    model: string;
    targetStage: string;
    prospectCompany: string;
    priorMeetingsJson: string;
    hasHistory: boolean;
  }): Promise<{ result: MeetingBriefingResult; rawText?: string }>;

  /**
   * Puces « progrès » et « axes d’amélioration » pour la page Performance,
   * à partir des RDV, du profil de vente et de l’agrégat KISS sur la période.
   */
  summarizeTeamCoachingRecommendations(input: {
    systemMarkdown: string;
    model: string;
    statsWindowDays: StatsWindowDays;
    audience: "manager" | "commercial";
    meetings: SellerCommercialMeetingDigestForSummary[];
    salesProfile: SalesProfileScores | null;
    previousSalesProfile: SalesProfileScores | null;
    kissRollup: OrgKissRollupForSummary;
  }): Promise<TeamCoachingRecommendations>;
}
