import type { ProspectResearch } from "@/src/core/domain/prospect-research";
import type { PipedriveExtraction } from "@/src/core/domain/pipedrive-blocks";
import type {
  DiscMomentsOutput,
  SoncasMomentsOutput,
} from "@/src/core/domain/profile-moments";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { ScorecardGrid } from "@/src/core/domain/scorecard-grid";
import type { ScorecardGeneratedResult } from "@/src/core/domain/scorecard-result-zod";
import type { ObjectionsAnalysisResult } from "@/src/core/domain/objections-result-zod";
import type { ProspectProfileGenerated } from "@/src/core/domain/prospect-profile-zod";
import type {
  FollowUpEmailResult,
  FollowUpEmailRevision,
} from "@/src/core/domain/follow-up-email-zod";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";
import type { VisitReportExtraction } from "@/src/core/domain/visit-report-zod";
import type { MeetingFactsSuggestion } from "@/src/core/domain/meeting-prefill";
import type { MeetingChallenge } from "@/src/core/domain/meeting-challenges";
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
  }): Promise<{ result: SoncasMomentsOutput; rawText?: string } & AiCallTrace>;

  analyzeDisc(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: DiscMomentsOutput; rawText?: string } & AiCallTrace>;

  analyzeKiss(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
    /** Latest SONCAS / DISC structured results for this meeting, when already analyzed. */
    priorSoncasResult?: unknown;
    priorDiscResult?: unknown;
    /** Les défis laissés au rendez-vous précédent avec ce contact, à vérifier. */
    previousChallenges?: readonly MeetingChallenge[];
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

  /**
   * Les objections du prospect, avec la réponse apportée, son effet et une
   * suggestion pour la suite.
   *
   * Comme la scorecard, elle ne lit que le transcript : un profil
   * d'interlocuteur n'aide pas à retrouver ce qu'il a objecté, il aiderait
   * seulement le modèle à excuser une objection laissée sans réponse.
   */
  analyzeObjections(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<
    { result: ObjectionsAnalysisResult; rawText?: string } & AiCallTrace
  >;

  /**
   * SONCAS, DISC et les objections en un seul appel : le transcript n'est lu
   * qu'une fois, et les trois lectures s'appuient sur les mêmes passages.
   *
   * La consigne arrive déjà assemblée (`withProspectProfileSystemPrompt`) :
   * l'appelant la journalise telle qu'elle part au modèle.
   */
  analyzeProspectProfile(input: {
    systemPrompt: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<
    { result: ProspectProfileGenerated; rawText?: string } & AiCallTrace
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
   * Ce qui se lit dans une conversation pour remplir la fiche du rendez-vous :
   * le prospect, le type de rendez-vous, le résultat, un montant cité.
   */
  suggestMeetingFacts(input: {
    systemPrompt: string;
    model: string;
    transcriptExcerpt: string;
    meetingTypeOptions: readonly string[];
  }): Promise<MeetingFactsSuggestion>;

  /**
   * La matière du compte rendu de visite, lue dans le transcript.
   *
   * Le modèle ne rend que ce qui ne se trouve nulle part ailleurs (participants,
   * thèmes, objections, engagements, suite) ; le produit assemble le compte
   * rendu avec les analyses déjà faites, voir `composeVisitReport`.
   */
  extractVisitReport(input: {
    systemMarkdown: string;
    model: string;
    prospectName: string;
    prospectCompany: string | null;
    meetingAt: string;
    outcome: string;
    meetingType: string | null;
    transcript: string;
    notes: string | null;
    soncasSummary: string | null;
    discSummary: string | null;
  }): Promise<VisitReportExtraction>;

  /**
   * Les faits du rendez-vous pour les blocs Pipedrive (méthode SEED). Le
   * produit compose les blocs, voir `composePipedriveBlocks`.
   */
  extractPipedriveBlocks(input: {
    systemPrompt: string;
    model: string;
    contextJson: string;
    transcript: string;
    notes: string | null;
    previousReport: string | null;
  }): Promise<PipedriveExtraction>;

  /**
   * Une recherche web factuelle, par un modèle qui cherche en ligne : le texte
   * trouvé et les adresses consultées.
   */
  researchOnWeb(input: {
    model: string;
    prompt: string;
  }): Promise<{ text: string; sources: string[] }>;

  /** La fiche de préparation d'un premier rendez-vous, rangée à partir de la recherche. */
  structureProspectResearch(input: {
    systemPrompt: string;
    model: string;
    userPrompt: string;
  }): Promise<ProspectResearch>;

  /** Retouche un mail selon la demande du commercial. */
  reviseFollowUpEmail(input: {
    systemPrompt: string;
    model: string;
    userContent: string;
  }): Promise<FollowUpEmailRevision>;
}
