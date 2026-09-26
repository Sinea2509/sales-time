import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { ScorecardGrid } from "@/src/core/domain/scorecard-grid";
import type { ScorecardGeneratedResult } from "@/src/core/domain/scorecard-result-zod";
import type { FollowUpEmailResult } from "@/src/core/domain/follow-up-email-zod";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";
import type { MeetingDetailSynthesisResult } from "@/src/core/domain/meeting-detail-synthesis-zod";
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

export type AiCallUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type AiCallTrace = {
  systemPrompt: string;
  userPrompt: string;
  usage?: AiCallUsage;
};

export interface AnalysisPort {
  analyzeSoncas(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: SoncasAnalysisResult; rawText?: string } & AiCallTrace>;

  analyzeDisc(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: DiscAnalysisResult; rawText?: string } & AiCallTrace>;

  analyzeKiss(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
    /** Latest SONCAS / DISC structured results for this meeting, when already analyzed. */
    priorSoncasResult?: unknown;
    priorDiscResult?: unknown;
  }): Promise<{ result: KissAnalysisResult; rawText?: string } & AiCallTrace>;

  /**
   * Note le rendez-vous critère par critère, sur la grille de son type.
   *
   * La grille voyage jusqu'ici parce que c'est elle qui écrit la moitié non
   * modifiable de la consigne, celle qui porte les clés attendues. Elle n'est
   * pas choisie à ce niveau : l'appelant l'a déjà déduite du type de RDV, et
   * c'est aussi lui qui calculera le score depuis les niveaux rendus.
   *
   * Ni SONCAS ni DISC ne sont joints, à la différence de KISS. Ces deux
   * analyses décrivent le prospect, quand la scorecard mesure ce que le
   * commercial est allé chercher : un profil d'interlocuteur ne rend pas un
   * critère mieux couvert, il donne seulement au modèle de quoi excuser un
   * critère absent.
   */
  analyzeScorecard(input: {
    systemMarkdown: string;
    grid: ScorecardGrid;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<
    { result: ScorecardGeneratedResult; rawText?: string } & AiCallTrace
  >;

  generateFollowUpEmail(input: {
    systemMarkdown: string;
    userContent: string;
    model: string;
  }): Promise<{ result: FollowUpEmailResult; rawText?: string } & AiCallTrace>;

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
   * puis via les leviers SONCAS, à partir des transcriptions et des JSON d’analyse déjà produits.
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

  /**
   * Le transcript d'un enregistrement audio, mot pour mot, un intervenant
   * par ligne quand le modèle sait les distinguer.
   */
  transcribeAudio(input: {
    audio: Uint8Array;
    mediaType: string;
    model: string;
  }): Promise<{
    text: string;
    usage?: { inputTokens?: number; outputTokens?: number };
  }>;

  /**
   * Le compte rendu de visite écrit au fil de l'eau, pour l'afficher pendant
   * qu'il s'écrit. `text` se résout avec le texte complet, à conserver.
   */
  streamMeetingVisitReport(input: {
    systemMarkdown: string;
    model: string;
    prospectName: string;
    prospectCompany: string | null;
    meetingAt: string;
    outcome: string;
    meetingType: string | null;
    pipelineStage: string | null;
    transcriptExcerpt: string;
    discResult: unknown;
    soncasResult: unknown;
    kissResult: unknown;
  }): Promise<{ textStream: AsyncIterable<string>; text: PromiseLike<string> }>;

  /** Synthèse narrative du RDV + phrase profil interlocuteur (fiche RDV). */
  summarizeMeetingDetail(input: {
    systemMarkdown: string;
    model: string;
    prospectName: string;
    prospectCompany: string | null;
    meetingAt: string;
    outcome: string;
    meetingType: string | null;
    pipelineStage: string | null;
    transcriptExcerpt: string;
    discResult: unknown;
    soncasResult: unknown;
    kissResult: unknown;
  }): Promise<MeetingDetailSynthesisResult>;
}
