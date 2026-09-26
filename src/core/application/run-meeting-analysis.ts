import {
  withDataScopeSystemPrompt,
  withDiscSystemPrompt,
  withKissSystemPrompt,
  withScorecardSystemPrompt,
  withSoncasSystemPrompt,
} from "@/lib/ai-system-prompt";
import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import {
  buildDelimitedMeetingUserContent,
  buildKissUserPrompt,
} from "@/lib/meeting-text-for-ai-prompt";
import { resolveMeetingTranscriptForAnalysis } from "@/lib/meeting-transcript-for-analysis";
import {
  recordAiRequestError,
  recordAiRequestSuccess,
} from "@/lib/record-ai-request-log";
import {
  analysisSystemBlock,
  composeAnalysisSystemMarkdown,
  KISS_PLATFORM_BLOCK_HEADING,
} from "@/src/core/domain/analysis-system-markdown";
import { scorecardGridForMeeting } from "@/src/core/domain/scorecard-grid-for-meeting";
import { computeScorecardScore } from "@/src/core/domain/scorecard-score";
import { applySoncasEvidenceRule } from "@/src/core/domain/soncas-evidence-rule";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type {
  AiCallKind,
  AiRequestLogRepositoryPort,
} from "@/src/core/ports/ai-request-log-repository-port";
import type {
  MeetingAnalysisKind,
  MeetingRepositoryPort,
} from "@/src/core/ports/meeting-repository-port";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
} from "@/src/core/ports/prompt-template-repository-port";

export type RunMeetingAnalysisResult =
  | { ok: true; analysisId: string }
  | {
      ok: false;
      error:
        | "NO_ACTIVE_ORG"
        | "MEETING_NOT_FOUND"
        | "PROMPT_NOT_CONFIGURED"
        /**
         * Aucune grille ne correspond au type de ce rendez-vous.
         *
         * Une issue à part, et non un `ANALYSIS_FAILED` : rien n'a échoué, ce
         * rendez-vous ne se note simplement pas encore. L'appelant a besoin de
         * la distinction. Lancé sur une organisation entière, il doit passer au
         * suivant sans marquer le lot en erreur, et l'écran doit le dire au
         * commercial au lieu de lui montrer un incident technique.
         */
        | "NO_SCORECARD_GRID"
        | "ANALYSIS_FAILED";
      message?: string;
    };

export type AnalysisKindToRun = MeetingAnalysisKind;

function aiLogKind(kind: AnalysisKindToRun): AiCallKind {
  return kind === "KISS" ? "COACHING" : kind;
}

async function resolvePromptVersion(
  prompts: PromptTemplateRepositoryPort,
  kind: AnalysisKindSlug,
) {
  const defaultMarkdown = DEFAULT_ANALYSIS_PROMPT_MARKDOWN[kind];
  if (!defaultMarkdown?.trim()) {
    return null;
  }
  return prompts.ensureCurrentVersion({ kind, defaultMarkdown });
}

export async function runMeetingAnalysis(
  deps: {
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    analysis: AnalysisPort;
    aiLogs?: AiRequestLogRepositoryPort;
  },
  input: {
    organizationId: string | null;
    meetingId: string;
    kind: AnalysisKindToRun;
    jobId?: string | null;
    /** Suffixe markdown (paramètres org.) concaténé au prompt KISS global. */
    kissSystemMarkdownAppendix?: string | null;
    /**
     * Bloc playbook de l'organisation, ajouté à toutes les analyses.
     *
     * SONCAS et DISC ne recevaient jusqu'ici aucun contexte d'entreprise : le
     * modèle jugeait la découverte d'un prospect sans savoir ce qui se vend,
     * à qui, ni ce que la maison interdit de promettre.
     */
    organizationPlaybookMarkdown?: string | null;
  },
): Promise<RunMeetingAnalysisResult> {
  if (!input.organizationId) {
    return { ok: false, error: "NO_ACTIVE_ORG" };
  }

  const meeting = await deps.meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) {
    return { ok: false, error: "MEETING_NOT_FOUND" };
  }

  const transcriptForAnalysis = await resolveMeetingTranscriptForAnalysis({
    organizationId: input.organizationId,
    transcript: meeting.transcript,
    sourceBlobUrl: meeting.sourceBlobUrl,
    sourceType: meeting.sourceType,
  });

  let promptVersion;
  try {
    promptVersion = await resolvePromptVersion(deps.prompts, input.kind);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (deps.aiLogs) {
      const model = await resolvePromptGatewayModel(
        deps.prompts,
        input.kind,
      ).catch(() => "unknown");
      await recordAiRequestError(
        deps.aiLogs,
        {
          organizationId: input.organizationId,
          meetingId: meeting.id,
          jobId: input.jobId ?? null,
          kind: aiLogKind(input.kind),
          modelName: model,
          promptVersion: "0",
          systemPrompt: "",
          userPrompt: "",
        },
        { errorMessage: message, latencyMs: 0 },
      );
    }
    return { ok: false, error: "PROMPT_NOT_CONFIGURED", message };
  }
  if (!promptVersion) {
    if (deps.aiLogs) {
      const model = await resolvePromptGatewayModel(deps.prompts, input.kind);
      await recordAiRequestError(
        deps.aiLogs,
        {
          organizationId: input.organizationId,
          meetingId: meeting.id,
          jobId: input.jobId ?? null,
          kind: aiLogKind(input.kind),
          modelName: model,
          promptVersion: "0",
          systemPrompt: "",
          userPrompt: "",
        },
        { errorMessage: "Prompt not configured", latencyMs: 0 },
      );
    }
    return { ok: false, error: "PROMPT_NOT_CONFIGURED" };
  }

  const model = await resolvePromptGatewayModel(deps.prompts, input.kind);

  try {
    if (
      input.kind === "SONCAS" ||
      input.kind === "DISC" ||
      input.kind === "OBJECTIONS"
    ) {
      const profileSystemMarkdown = composeAnalysisSystemMarkdown(
        promptVersion.markdown,
        [input.organizationPlaybookMarkdown],
      );
      /*
        Le même choix qu'à la ligne de l'appel, plus bas, et il faut qu'il le
        reste : ce `systemPrompt` ne part pas au modèle, il part au journal.
        L'adaptateur refabrique le sien depuis `profileSystemMarkdown`. Deux
        enrobages différents ici et là-bas donneraient un journal qui décrit une
        consigne qui n'a jamais été envoyée, c'est-à-dire pire qu'un journal
        absent, puisqu'on le relit justement pour comprendre une note surprenante.
      */
      const systemPrompt =
        input.kind === "SONCAS"
          ? withSoncasSystemPrompt(profileSystemMarkdown)
          : input.kind === "DISC"
            ? withDiscSystemPrompt(profileSystemMarkdown)
            : withDataScopeSystemPrompt(profileSystemMarkdown);
      const userPrompt = buildDelimitedMeetingUserContent({
        transcript: transcriptForAnalysis,
        notes: meeting.notes,
      });
      const logBase = {
        organizationId: input.organizationId,
        meetingId: meeting.id,
        jobId: input.jobId ?? null,
        kind: aiLogKind(input.kind),
        modelName: model,
        promptVersion: String(promptVersion.version),
        systemPrompt,
        userPrompt,
      };
      const started = Date.now();

      const analyze =
        input.kind === "SONCAS"
          ? deps.analysis.analyzeSoncas
          : input.kind === "DISC"
            ? deps.analysis.analyzeDisc
            : deps.analysis.analyzeObjections;
      try {
        const out = await analyze({
          systemMarkdown: profileSystemMarkdown,
          transcript: transcriptForAnalysis,
          notes: meeting.notes,
          model,
        });
        /*
          Le journal garde ce que le modèle a rendu, pas ce que le produit en a
          fait, comme pour la scorecard plus bas. C'est la seule trace où l'on
          puisse constater qu'un levier avait été annoncé à 80 sans une citation
          pour le tenir : la fiche, elle, ne montrera plus que le 19.
        */
        await recordAiRequestSuccess(deps.aiLogs, logBase, {
          rawOutput: out.result,
          inputTokens: out.usage?.inputTokens ?? null,
          outputTokens: out.usage?.outputTokens ?? null,
          latencyMs: Date.now() - started,
        });
        const result =
          input.kind === "SONCAS"
            ? applySoncasEvidenceRule(out.result)
            : out.result;
        const row = await deps.meetings.createAnalysis({
          meetingId: meeting.id,
          kind: input.kind,
          promptVersionId: promptVersion.id,
          model,
          result,
        });
        return { ok: true, analysisId: row.id };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await recordAiRequestError(deps.aiLogs, logBase, {
          errorMessage: message,
          latencyMs: Date.now() - started,
        });
        return { ok: false, error: "ANALYSIS_FAILED", message };
      }
    }

    if (input.kind === "SCORECARD") {
      /*
        La grille se choisit ici, et non dans l'adaptateur : c'est le rendez-vous
        qui la détermine, et c'est aussi ici que le score se calcule ensuite. Les
        deux doivent employer la même, sans quoi des niveaux notés sur une grille
        seraient additionnés sur les poids d'une autre.
      */
      const grid = scorecardGridForMeeting({
        meetingType: meeting.meetingType,
        pipelineStage: meeting.pipelineStage,
      });
      if (!grid) {
        return { ok: false, error: "NO_SCORECARD_GRID" };
      }

      const scorecardSystemMarkdown = composeAnalysisSystemMarkdown(
        promptVersion.markdown,
        [input.organizationPlaybookMarkdown],
      );
      const systemPrompt = withScorecardSystemPrompt(
        scorecardSystemMarkdown,
        grid,
      );
      const userPrompt = buildDelimitedMeetingUserContent({
        transcript: transcriptForAnalysis,
        notes: meeting.notes,
      });
      const logBase = {
        organizationId: input.organizationId,
        meetingId: meeting.id,
        jobId: input.jobId ?? null,
        kind: aiLogKind(input.kind),
        modelName: model,
        promptVersion: String(promptVersion.version),
        systemPrompt,
        userPrompt,
      };
      const started = Date.now();

      try {
        const out = await deps.analysis.analyzeScorecard({
          systemMarkdown: scorecardSystemMarkdown,
          grid,
          transcript: transcriptForAnalysis,
          notes: meeting.notes,
          model,
        });
        /*
          Le journal garde ce que le modèle a rendu, pas ce que le produit en a
          fait. Y écrire le score calculé donnerait à relire un chiffre que le
          modèle n'a jamais produit, à l'endroit même où l'on vient vérifier ce
          qu'il a produit.
        */
        await recordAiRequestSuccess(deps.aiLogs, logBase, {
          rawOutput: out.result,
          inputTokens: out.usage?.inputTokens ?? null,
          outputTokens: out.usage?.outputTokens ?? null,
          latencyMs: Date.now() - started,
        });
        const { blocks, overallScore } = computeScorecardScore(
          grid,
          out.result.criteria,
        );
        const row = await deps.meetings.createAnalysis({
          meetingId: meeting.id,
          kind: input.kind,
          promptVersionId: promptVersion.id,
          model,
          /*
            La grille employée est enregistrée avec les niveaux. Une analyse
            relue dans six mois doit rendre le score qu'elle annonçait le jour
            où elle a été produite, même si la grille a gagné un critère depuis.
          */
          result: {
            ...out.result,
            gridId: grid.id,
            gridName: grid.name,
            overallScore,
            blocks,
          },
        });
        return { ok: true, analysisId: row.id };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await recordAiRequestError(deps.aiLogs, logBase, {
          errorMessage: message,
          latencyMs: Date.now() - started,
        });
        return { ok: false, error: "ANALYSIS_FAILED", message };
      }
    }

    /*
      Ce qui reste est forcément KISS, et le typage le sait. Le garde-fou existe
      quand même parce que le typage repose ici sur une promesse que personne ne
      vérifie : le dépôt Prisma relit `kind` depuis la base et le convertit sans
      contrôle. Une valeur ajoutée à l'énumération et pas ici arriverait donc
      jusqu'à ce point et repartirait analysée en KISS, enregistrée sous le nom
      qu'elle porte, avec un résultat qui n'a rien à voir avec ce qu'on attend
      d'elle.
    */
    if (input.kind !== "KISS") {
      return {
        ok: false,
        error: "ANALYSIS_FAILED",
        message: `Analyse non prise en charge : ${String(input.kind)}`,
      };
    }

    const [priorSoncas, priorDisc] = await Promise.all([
      deps.meetings.findLatestAnalysisForMeeting({
        meetingId: meeting.id,
        organizationId: input.organizationId,
        kind: "SONCAS",
      }),
      deps.meetings.findLatestAnalysisForMeeting({
        meetingId: meeting.id,
        organizationId: input.organizationId,
        kind: "DISC",
      }),
    ]);

    const kissSystemMarkdown = composeAnalysisSystemMarkdown(
      promptVersion.markdown,
      [
        analysisSystemBlock(
          KISS_PLATFORM_BLOCK_HEADING,
          input.kissSystemMarkdownAppendix,
        ),
        input.organizationPlaybookMarkdown,
      ],
    );
    /*
      Le même enrobage que celui appliqué par l'adaptateur, et non l'enrobage
      générique. Le modèle recevait déjà le bon texte ; c'est la ligne
      d'`AiRequestLog` relue après coup qui en omettait la définition des six
      notes et l'échelle du coachingScore, soit précisément les consignes qu'on
      vient chercher dans un journal quand une note surprend.
    */
    const systemPrompt = withKissSystemPrompt(kissSystemMarkdown);
    const userPrompt = buildKissUserPrompt({
      transcript: transcriptForAnalysis,
      notes: meeting.notes,
      priorSoncasResult: priorSoncas?.result,
      priorDiscResult: priorDisc?.result,
    });
    const logBase = {
      organizationId: input.organizationId,
      meetingId: meeting.id,
      jobId: input.jobId ?? null,
      kind: aiLogKind(input.kind),
      modelName: model,
      promptVersion: String(promptVersion.version),
      systemPrompt,
      userPrompt,
    };
    const started = Date.now();

    try {
      const out = await deps.analysis.analyzeKiss({
        systemMarkdown: kissSystemMarkdown,
        transcript: transcriptForAnalysis,
        notes: meeting.notes,
        model,
        priorSoncasResult: priorSoncas?.result,
        priorDiscResult: priorDisc?.result,
      });
      await recordAiRequestSuccess(deps.aiLogs, logBase, {
        rawOutput: out.result,
        inputTokens: out.usage?.inputTokens ?? null,
        outputTokens: out.usage?.outputTokens ?? null,
        latencyMs: Date.now() - started,
      });
      const row = await deps.meetings.createAnalysis({
        meetingId: meeting.id,
        kind: input.kind,
        promptVersionId: promptVersion.id,
        model,
        result: out.result,
      });
      return { ok: true, analysisId: row.id };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await recordAiRequestError(deps.aiLogs, logBase, {
        errorMessage: message,
        latencyMs: Date.now() - started,
      });
      return { ok: false, error: "ANALYSIS_FAILED", message };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "ANALYSIS_FAILED", message };
  }
}
