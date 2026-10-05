import { reuseAnalysisOutput } from "./reuse-analysis-output";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";
import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";
import {
  scorecardResultSchema,
  type ScorecardAnalysisResult,
} from "@/src/core/domain/scorecard-result-zod";
import {
  analysisReliabilityFromWords,
  countWords,
} from "@/src/core/domain/analysis-reliability";
import {
  composeVisitReport,
  isCurrentVisitReport,
  withDatesFromTranscript,
  withMomentsFromTranscript,
  withQuotesFromTranscript,
  type VisitReportHistoryEntry,
} from "@/src/core/domain/visit-report";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type {
  MeetingDetailWithAnalyses,
  MeetingRepositoryPort,
} from "@/src/core/ports/meeting-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { OrganizationPromptRepositoryPort } from "@/src/core/ports/organization-prompt-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";
import { toAppTimeZoneDatetimeLocal } from "@/src/core/domain/app-time-zone";
import { resolveAnalysisPrompt } from "./resolve-analysis-prompt";

export type MeetingDetailSynthesisContent = {
  meetingSynthesis: string;
  interlocutorProfile: string;
  fromAi: boolean;
};

/** Le compte rendu à afficher sur la fiche, et s'il reste à l'écrire. */
export type MeetingVisitReportForPage = MeetingDetailSynthesisContent & {
  /**
   * Vrai quand le rendez-vous est analysé mais que son compte rendu manque :
   * la fiche le fait écrire en arrière-plan, et affiche en attendant le texte
   * indicatif.
   */
  needsWriting: boolean;
};

/**
 * Le compte rendu enregistré, s'il a la forme d'aujourd'hui. Un compte rendu
 * écrit avant le lot 80a (quelques lignes de synthèse) vaut « manquant » : il
 * se réécrit à la première ouverture de la fiche, pour que chaque rendez-vous
 * ait le compte rendu complet.
 */
function currentStoredReport(draft: string | null | undefined): string | null {
  const text = draft?.trim();
  return text && isCurrentVisitReport(text) ? text : null;
}

const PROCESSING_REPORT_MESSAGE =
  "Compte-rendu en cours de génération, disponible à la fin de l'analyse automatique.";

const PENDING_REPORT_MESSAGE =
  "L'analyse automatique (SONCAS, DISC, KISS) démarrera dès que le rendez-vous sera enregistré.";

/**
 * La part du transcript transmise pour le compte rendu.
 *
 * Elle était de 8 000 caractères, soit une douzaine de minutes de rendez-vous :
 * le compte rendu d'un rendez-vous d'une heure s'écrivait sur son premier
 * quart, et tout ce qui se décidait à la fin (le prochain rendez-vous, les
 * engagements) n'y figurait jamais. 60 000 caractères ne suffisaient pas
 * encore : un transcript Teams d'une heure, avec un nom et un horodatage par
 * réplique, les dépasse, et le prix et la prochaine étape se discutent à la
 * fin. 150 000 caractères couvrent deux heures et restent sous les limites des
 * modèles proposés.
 */
export const VISIT_REPORT_TRANSCRIPT_MAX_CHARS = 150_000;

/** Les rendez-vous précédents repris dans l'historique du compte. */
const VISIT_REPORT_HISTORY_MAX = 5;

type VisitReportDeps = {
  analysis: AnalysisPort;
  prompts: PromptTemplateRepositoryPort;
  /** La consigne du compte rendu, quand l'organisation a modifié la sienne. */
  organizationPrompts: OrganizationPromptRepositoryPort;
  meetings?: MeetingRepositoryPort;
  users?: Pick<UserRepositoryPort, "findAccountProfileByUserId">;
  organizationSettings?: Pick<
    OrganizationSettingsRepositoryPort,
    "findByOrganizationId"
  >;
  /** Pour rendre à l'identique un compte rendu déjà extrait du même transcript. */
  aiSummaryCache?: AiSummaryCacheRepositoryPort;
};

function interlocutorProfileFromAnalyses(input: {
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
}): string {
  const profileParts = [
    input.discResult?.summary?.trim(),
    input.soncasResult?.summary?.trim(),
  ].filter((s): s is string => Boolean(s));
  return profileParts.length > 0
    ? profileParts.join(" ")
    : "Profil interlocuteur disponible après l'analyse automatique.";
}

function fallbackSynthesis(input: {
  status: MeetingStatus;
  kissResult: KissAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
}): MeetingDetailSynthesisContent {
  const meetingSynthesis =
    input.status === "PROCESSING"
      ? PROCESSING_REPORT_MESSAGE
      : input.kissResult?.summary?.trim() || PENDING_REPORT_MESSAGE;

  return {
    meetingSynthesis,
    interlocutorProfile: interlocutorProfileFromAnalyses(input),
    fromAi: false,
  };
}

async function sellerDisplayName(
  users: VisitReportDeps["users"],
  sellerUserId: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  if (!users) return null;
  if (cache.has(sellerUserId)) return cache.get(sellerUserId) ?? null;
  const profile = await users
    .findAccountProfileByUserId(sellerUserId)
    .catch(() => null);
  const name =
    [profile?.firstName, profile?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ") || null;
  cache.set(sellerUserId, name);
  return name;
}

/**
 * Ce que la base sait autour du rendez-vous : sa durée, le nom de
 * l'organisation, le commercial, et les rendez-vous précédents avec ce contact.
 *
 * Chaque morceau est facultatif. Un compte rendu sans historique reste un bon
 * compte rendu ; un compte rendu jamais écrit parce qu'une requête annexe a
 * échoué serait une perte sèche. Un historique illisible vaut `null`, et non
 * une liste vide : le texte ne doit pas annoncer un premier rendez-vous sur un
 * compte qui en a déjà eu.
 *
 * Le score de grille d'un rendez-vous précédent n'est repris que s'il est du
 * même commercial : la grille d'un collègue ne se lit que par lui et par les
 * managers.
 */
async function loadVisitReportContext(
  deps: VisitReportDeps,
  input: { meeting: MeetingDetailWithAnalyses; organizationId?: string },
): Promise<{
  durationMin: number | null;
  organizationName: string | null;
  sellerName: string | null;
  history: VisitReportHistoryEntry[] | null;
  historyTotal: number;
}> {
  const names = new Map<string, string | null>();
  const sellerName = await sellerDisplayName(
    deps.users,
    input.meeting.sellerUserId,
    names,
  );
  const organizationId = input.organizationId;
  if (!organizationId || !deps.meetings) {
    return {
      durationMin: null,
      organizationName: null,
      sellerName,
      history: null,
      historyTotal: 0,
    };
  }
  const meetings = deps.meetings;

  const [row, settings, personMeetings] = await Promise.all([
    meetings
      .findMeetingByIdForOrg({ id: input.meeting.id, organizationId })
      .catch(() => null),
    deps.organizationSettings
      ? deps.organizationSettings
          .findByOrganizationId(organizationId)
          .catch(() => null)
      : Promise.resolve(null),
    meetings
      .listMeetingsForPersonInOrg({
        organizationId,
        personId: input.meeting.personId,
      })
      .catch(() => null),
  ]);

  const base = {
    durationMin: row?.durationMin ?? null,
    organizationName: settings?.companyName?.trim() || null,
    sellerName,
  };
  if (personMeetings === null) {
    return { ...base, history: null, historyTotal: 0 };
  }

  const earlier = personMeetings
    .filter(
      (m) =>
        m.id !== input.meeting.id &&
        m.meetingAt.getTime() < input.meeting.meetingAt.getTime(),
    )
    .sort((a, b) => b.meetingAt.getTime() - a.meetingAt.getTime());

  const history: VisitReportHistoryEntry[] = [];
  for (const m of earlier.slice(0, VISIT_REPORT_HISTORY_MAX)) {
    const entry = {
      meetingAt: m.meetingAt,
      meetingType: m.meetingType,
      sellerName: await sellerDisplayName(deps.users, m.sellerUserId, names),
    };
    if (m.sellerUserId !== input.meeting.sellerUserId) {
      history.push(entry);
      continue;
    }
    const scorecard = await meetings
      .findLatestAnalysisForMeeting({
        meetingId: m.id,
        organizationId,
        kind: "SCORECARD",
      })
      .catch(() => null);
    const parsed = scorecard
      ? scorecardResultSchema.safeParse(scorecard.result)
      : null;
    history.push({
      ...entry,
      gridScore: parsed?.success ? parsed.data.overallScore : null,
    });
  }

  return { ...base, history, historyTotal: earlier.length };
}

export async function summarizeMeetingDetail(
  deps: VisitReportDeps,
  input: {
    meeting: MeetingDetailWithAnalyses;
    discResult: DiscAnalysisResult | null;
    soncasResult: SoncasAnalysisResult | null;
    kissResult: KissAnalysisResult | null;
    /** La grille du rendez-vous : maturité, manques et qualité s'y lisent. */
    scorecardResult?: ScorecardAnalysisResult | null;
    /** Bypass READY guard (analysis worker after SONCAS/DISC/KISS). */
    forceAiGeneration?: boolean;
    /**
     * L'organisation du rendez-vous, obligatoire : c'est elle qui choisit la
     * consigne du compte rendu, et un appel qui l'oublierait écrirait en
     * silence avec la consigne d'origine.
     */
    organizationId: string;
  },
): Promise<MeetingDetailSynthesisContent> {
  const storedReport = currentStoredReport(input.meeting.visitReportDraft);
  if (storedReport) {
    return {
      meetingSynthesis: storedReport,
      interlocutorProfile: interlocutorProfileFromAnalyses(input),
      fromAi: true,
    };
  }

  const fallback = fallbackSynthesis({
    status: input.meeting.status,
    ...input,
  });

  const canGenerateAi =
    input.forceAiGeneration === true || input.meeting.status === "READY";

  if (
    !canGenerateAi ||
    !getEnv().AI_GATEWAY_API_KEY ||
    !input.meeting.transcript.trim()
  ) {
    return fallback;
  }

  try {
    const [prompt, model, context] = await Promise.all([
      resolveAnalysisPrompt(deps, {
        kind: "MEETING_DETAIL_SYNTHESIS",
        organizationId: input.organizationId,
      }),
      resolvePromptGatewayModel(deps.prompts, "MEETING_DETAIL_SYNTHESIS"),
      loadVisitReportContext(deps, {
        meeting: input.meeting,
        organizationId: input.organizationId,
      }),
    ]);
    const extractionInput = {
      systemMarkdown: prompt.markdown,
      model,
      prospectName: input.meeting.prospectName,
      prospectCompany: input.meeting.prospectCompany,
      // L'heure de Paris, celle que le commercial a saisie, et non l'heure universelle.
      meetingAt: toAppTimeZoneDatetimeLocal(input.meeting.meetingAt),
      outcome: input.meeting.outcome,
      meetingType: input.meeting.meetingType,
      transcript: input.meeting.transcript.slice(
        0,
        VISIT_REPORT_TRANSCRIPT_MAX_CHARS,
      ),
      notes: input.meeting.notes,
      soncasSummary: input.soncasResult?.summary?.trim() || null,
      discSummary: input.discResult?.summary?.trim() || null,
    };
    /* Le même transcript avec la même consigne rend le même compte rendu. */
    const { value: extracted } = await reuseAnalysisOutput(deps, {
      organizationId: input.organizationId,
      kind: "MEETING_DETAIL_SYNTHESIS",
      model,
      systemPrompt: prompt.markdown,
      userPrompt: JSON.stringify({ ...extractionInput, systemMarkdown: null }),
      compute: () => deps.analysis.extractVisitReport(extractionInput),
    });
    // Un moment que le transcript ne porte pas a été estimé : il ne s'écrit pas.
    const extraction = withDatesFromTranscript(
      withQuotesFromTranscript(
        withMomentsFromTranscript(extracted, input.meeting.transcript),
        input.meeting.transcript,
      ),
      input.meeting.transcript,
    );

    const meetingSynthesis = composeVisitReport({
      meeting: {
        prospectName: input.meeting.prospectName,
        prospectCompany: input.meeting.prospectCompany,
        meetingAt: input.meeting.meetingAt,
        meetingType: input.meeting.meetingType,
        durationMin: context.durationMin,
        potentialAmount: input.meeting.potentialAmount,
        pipelineStage: input.meeting.pipelineStage,
        analysisReliability: analysisReliabilityFromWords(
          countWords(input.meeting.transcript),
        ).level,
      },
      organizationName: context.organizationName,
      sellerName: context.sellerName,
      history: context.history,
      historyTotal: context.historyTotal,
      extraction,
      soncas: input.soncasResult,
      disc: input.discResult,
      scorecard: input.scorecardResult ?? null,
    });

    if (deps.meetings) {
      await deps.meetings
        .updateMeetingVisitReportDraft({
          id: input.meeting.id,
          organizationId: input.organizationId,
          visitReportDraft: meetingSynthesis,
        })
        .catch(() => undefined);
    }
    return {
      meetingSynthesis,
      interlocutorProfile: interlocutorProfileFromAnalyses(input),
      fromAi: true,
    };
  } catch {
    return fallback;
  }
}

/**
 * Le compte rendu à afficher sur la fiche, sans jamais appeler le modèle.
 *
 * Le compte rendu s'écrit en arrière-plan à la fin des analyses. S'il manque
 * sur un rendez-vous analysé (l'écriture a échoué, ou le rendez-vous vient
 * d'être modifié), la fiche ne l'écrit pas pendant son affichage : lire 60 000
 * caractères de transcript prend une minute, que le commercial passerait
 * devant une page blanche. Elle affiche le texte indicatif et signale, par
 * `needsWriting`, qu'il reste à l'écrire en arrière-plan.
 */
export function meetingVisitReportForPage(input: {
  meeting: Pick<
    MeetingDetailWithAnalyses,
    "visitReportDraft" | "status" | "transcript"
  >;
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
  kissResult: KissAnalysisResult | null;
}): MeetingVisitReportForPage {
  const storedReport = currentStoredReport(input.meeting.visitReportDraft);
  if (storedReport) {
    return {
      meetingSynthesis: storedReport,
      interlocutorProfile: interlocutorProfileFromAnalyses(input),
      fromAi: true,
      needsWriting: false,
    };
  }
  const needsWriting =
    input.meeting.status === "READY" &&
    Boolean(getEnv().AI_GATEWAY_API_KEY) &&
    input.meeting.transcript.trim().length > 0;
  return {
    ...fallbackSynthesis({ status: input.meeting.status, ...input }),
    needsWriting,
  };
}

/**
 * Écrit et enregistre le compte rendu de visite à la fin des analyses.
 *
 * Il s'écrit ici, en arrière-plan, plutôt qu'à la première ouverture de la
 * fiche : la page n'attend pas le modèle, et le texte est prêt quand le
 * commercial arrive.
 */
export async function generateAndPersistMeetingVisitReport(
  deps: VisitReportDeps & { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string;
    meeting: MeetingDetailWithAnalyses;
    discResult: DiscAnalysisResult | null;
    soncasResult: SoncasAnalysisResult | null;
    kissResult: KissAnalysisResult | null;
    scorecardResult?: ScorecardAnalysisResult | null;
  },
): Promise<void> {
  await summarizeMeetingDetail(deps, {
    ...input,
    forceAiGeneration: true,
  });
}
