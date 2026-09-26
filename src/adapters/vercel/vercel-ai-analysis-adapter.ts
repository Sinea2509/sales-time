import { generateObject, generateText, streamText } from "ai";
import { z } from "zod";
import {
  discAnalysisOutputSchema,
  soncasAnalysisOutputSchema,
} from "@/src/core/domain/analysis-result-zod";
import { kissGeneratedResultSchema } from "@/src/core/domain/kiss-result-zod";
import type { ScorecardGrid } from "@/src/core/domain/scorecard-grid";
import { scorecardGeneratedResultSchema } from "@/src/core/domain/scorecard-result-zod";
import { objectionsResultSchema } from "@/src/core/domain/objections-result-zod";
import { followUpEmailResultSchema } from "@/src/core/domain/follow-up-email-zod";
import { meetingBriefingSchema } from "@/src/core/domain/meeting-briefing-zod";
import { meetingDetailSynthesisSchema } from "@/src/core/domain/meeting-detail-synthesis-zod";
import { teamCoachingRecommendationsSchema } from "@/src/core/domain/team-coaching-recommendations-zod";
import type {
  AnalysisPort,
  OrgKissRollupForSummary,
  SellerCommercialMeetingDigestForSummary,
  SellerCommercialPerformanceSummary,
  SellerRelationalAffinitySummary,
} from "@/src/core/ports/analysis-port";
import {
  withDataScopeSystemPrompt,
  withDiscSystemPrompt,
  withKissSystemPrompt,
  withScorecardSystemPrompt,
  withSoncasSystemPrompt,
} from "@/lib/ai-system-prompt";
import {
  buildDelimitedMeetingUserContent,
  buildKissUserPrompt,
} from "@/lib/meeting-text-for-ai-prompt";

const sellerCommercialPerformanceSummarySchema = z.object({
  forces: z.string(),
  axesAmelioration: z.string(),
  aStopper: z.string(),
});

const sellerRelationalAffinitySummarySchema = z.object({
  discAffinity: z.string(),
  soncasAffinity: z.string(),
});

export class VercelAIAnalysisAdapter implements AnalysisPort {
  async analyzeSoncas(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }) {
    const userPrompt = buildDelimitedMeetingUserContent({
      transcript: input.transcript,
      notes: input.notes,
    });
    const systemPrompt = withSoncasSystemPrompt(input.systemMarkdown);

    const { object, usage } = await generateObject({
      model: input.model,
      schema: soncasAnalysisOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return {
      result: object,
      systemPrompt,
      userPrompt,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async analyzeDisc(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }) {
    const userPrompt = buildDelimitedMeetingUserContent({
      transcript: input.transcript,
      notes: input.notes,
    });
    const systemPrompt = withDiscSystemPrompt(input.systemMarkdown);

    const { object, usage } = await generateObject({
      model: input.model,
      schema: discAnalysisOutputSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return {
      result: object,
      systemPrompt,
      userPrompt,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async analyzeKiss(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
    priorSoncasResult?: unknown;
    priorDiscResult?: unknown;
  }) {
    const userPrompt = buildKissUserPrompt({
      transcript: input.transcript,
      notes: input.notes,
      priorSoncasResult: input.priorSoncasResult,
      priorDiscResult: input.priorDiscResult,
    });
    const systemPrompt = withKissSystemPrompt(input.systemMarkdown);

    // Le schéma de génération, pas celui de lecture : le modèle doit fournir
    // les six notes du commercial. Le schéma de lecture les accepte absentes,
    // pour ne pas invalider l'historique, et cette tolérance n'a rien à faire
    // ici où l'analyse est produite.
    const { object, usage } = await generateObject({
      model: input.model,
      schema: kissGeneratedResultSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return {
      result: object,
      systemPrompt,
      userPrompt,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async analyzeScorecard(input: {
    systemMarkdown: string;
    grid: ScorecardGrid;
    transcript: string;
    notes: string | null;
    model: string;
  }) {
    const userPrompt = buildDelimitedMeetingUserContent({
      transcript: input.transcript,
      notes: input.notes,
    });
    const systemPrompt = withScorecardSystemPrompt(
      input.systemMarkdown,
      input.grid,
    );

    // Le schéma de génération : des niveaux et des preuves, aucun total. Le
    // schéma de lecture porte en plus le score et les sous-totaux, que le
    // produit calcule après cet appel ; les réclamer ici reviendrait à demander
    // au modèle l'addition qu'on lui retire justement des mains.
    const { object, usage } = await generateObject({
      model: input.model,
      schema: scorecardGeneratedResultSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return {
      result: object,
      systemPrompt,
      userPrompt,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async analyzeObjections(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }) {
    const userPrompt = buildDelimitedMeetingUserContent({
      transcript: input.transcript,
      notes: input.notes,
    });
    const systemPrompt = withDataScopeSystemPrompt(input.systemMarkdown);

    const { object, usage } = await generateObject({
      model: input.model,
      schema: objectionsResultSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return {
      result: object,
      systemPrompt,
      userPrompt,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async generateFollowUpEmail(input: {
    systemMarkdown: string;
    userContent: string;
    model: string;
  }) {
    const systemPrompt = withDataScopeSystemPrompt(input.systemMarkdown);
    const userPrompt = input.userContent;

    const { object, usage } = await generateObject({
      model: input.model,
      schema: followUpEmailResultSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return {
      result: object,
      systemPrompt,
      userPrompt,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async summarizeOrgKissRollup(input: {
    systemMarkdown: string;
    rollup: OrgKissRollupForSummary;
    model: string;
  }): Promise<string> {
    const system = withDataScopeSystemPrompt(input.systemMarkdown);
    const userContent = [
      "Agrégats KISS (JSON) :",
      JSON.stringify(input.rollup, null, 2),
    ].join("\n");

    const { text } = await generateText({
      model: input.model,
      system,
      prompt: userContent,
      maxOutputTokens: 450,
    });
    return text.trim();
  }

  async summarizeSellerCommercialPerformance(input: {
    systemMarkdown: string;
    sellerDisplayName: string;
    meetings: SellerCommercialMeetingDigestForSummary[];
    model: string;
  }): Promise<SellerCommercialPerformanceSummary> {
    const system = withDataScopeSystemPrompt(input.systemMarkdown);
    const userContent = [
      "Contexte commercial (JSON) :",
      JSON.stringify(
        {
          commercial: input.sellerDisplayName,
          rendezVous: input.meetings,
        },
        null,
        2,
      ),
    ].join("\n");

    const { object } = await generateObject({
      model: input.model,
      system,
      schema: sellerCommercialPerformanceSummarySchema,
      prompt: userContent,
      maxOutputTokens: 900,
    });
    return {
      forces: object.forces.trim(),
      axesAmelioration: object.axesAmelioration.trim(),
      aStopper: object.aStopper.trim(),
    };
  }

  async summarizeSellerRelationalAffinity(input: {
    systemMarkdown: string;
    sellerDisplayName: string;
    meetings: SellerCommercialMeetingDigestForSummary[];
    model: string;
  }): Promise<SellerRelationalAffinitySummary> {
    const system = withDataScopeSystemPrompt(input.systemMarkdown);
    const userContent = [
      "Contexte commercial (JSON) :",
      JSON.stringify(
        {
          commercial: input.sellerDisplayName,
          rendezVous: input.meetings,
        },
        null,
        2,
      ),
    ].join("\n");

    const { object } = await generateObject({
      model: input.model,
      system,
      schema: sellerRelationalAffinitySummarySchema,
      prompt: userContent,
      maxOutputTokens: 700,
    });
    return {
      discAffinity: object.discAffinity.trim(),
      soncasAffinity: object.soncasAffinity.trim(),
    };
  }

  async summarizeTeamCoachingRecommendations(input: {
    systemMarkdown: string;
    model: string;
    statsWindowDays: number;
    audience: "manager" | "commercial";
    meetings: SellerCommercialMeetingDigestForSummary[];
    salesProfile: Record<string, number> | null;
    previousSalesProfile: Record<string, number> | null;
    kissRollup: OrgKissRollupForSummary;
  }) {
    const system = withDataScopeSystemPrompt(input.systemMarkdown);
    const userContent = [
      `Période : ${input.statsWindowDays} derniers jours.`,
      "Contexte (JSON) :",
      JSON.stringify(
        {
          audience: input.audience,
          profilVenteActuel: input.salesProfile,
          profilVentePeriodePrecedente: input.previousSalesProfile,
          agregatsKiss: input.kissRollup,
          rendezVous: input.meetings,
        },
        null,
        2,
      ),
    ].join("\n");

    const { object } = await generateObject({
      model: input.model,
      system,
      schema: teamCoachingRecommendationsSchema,
      prompt: userContent,
      maxOutputTokens: 900,
    });
    return {
      progressBullets: object.progressBullets.map((s) => s.trim()),
      improvementBullets: object.improvementBullets.map((s) => s.trim()),
    };
  }

  async transcribeAudio(input: {
    audio: Uint8Array;
    mediaType: string;
    model: string;
  }) {
    /*
      L'enregistrement part en pièce jointe du message, pas en lien : la
      passerelle n'a alors rien à télécharger, et le fichier ne quitte le
      stockage que vers le modèle. La consigne interdit le résumé : un
      transcript raccourci fausserait ensuite SONCAS, DISC et le coaching.
    */
    const { text, usage } = await generateText({
      model: input.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Transcris intégralement cet enregistrement d'un rendez-vous commercial, en français, mot pour mot.",
                "Ne résume pas, ne reformule pas, n'omets rien. Écris une réplique par ligne, et fais commencer chaque ligne par celui qui parle : « Commercial : » pour la personne qui présente l'offre et pose les questions de découverte, « Prospect : » pour celle qui répond (ou « Intervenant 1 : », « Intervenant 2 : » si leur rôle n'est vraiment pas clair). Ces étiquettes servent à mesurer la répartition de la parole : ne les omets sur aucune ligne.",
                "Ne mets ni titre, ni commentaire, ni horodatage : uniquement le transcript.",
              ].join(" "),
            },
            { type: "file", data: input.audio, mediaType: input.mediaType },
          ],
        },
      ],
      maxOutputTokens: 32_000,
    });
    return {
      text: text.trim(),
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      },
    };
  }

  async streamMeetingVisitReport(input: {
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
  }) {
    /*
      Le même prompt que la synthèse structurée, mais il ne rend qu'un seul
      des deux champs : le compte rendu, en texte brut, pour qu'il puisse
      s'afficher lettre à lettre. Le profil de l'interlocuteur, lui, se lit
      déjà dans les analyses DISC et SONCAS.
    */
    const system = withDataScopeSystemPrompt(
      [
        input.systemMarkdown,
        "",
        "Consigne de format pour cette réponse : rends uniquement le texte du champ meetingSynthesis, sans JSON, sans guillemets, sans le champ interlocutorProfile, sans commentaire.",
      ].join("\n"),
    );
    const userContent = [
      "Contexte rendez-vous (JSON) :",
      JSON.stringify(
        {
          prospect: input.prospectName,
          entreprise: input.prospectCompany,
          dateRdv: input.meetingAt,
          resultat: input.outcome,
          typeRdv: input.meetingType,
          etape: input.pipelineStage,
          extraitTranscript: input.transcriptExcerpt,
          discResult: input.discResult,
          soncasResult: input.soncasResult,
          kissResult: input.kissResult,
        },
        null,
        2,
      ),
    ].join("\n");

    const result = streamText({
      model: input.model,
      system,
      prompt: userContent,
      maxOutputTokens: 900,
    });
    return { textStream: result.textStream, text: result.text };
  }

  async summarizeMeetingDetail(input: {
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
  }) {
    const system = withDataScopeSystemPrompt(input.systemMarkdown);
    const userContent = [
      "Contexte rendez-vous (JSON) :",
      JSON.stringify(
        {
          prospect: input.prospectName,
          entreprise: input.prospectCompany,
          dateRdv: input.meetingAt,
          resultat: input.outcome,
          typeRdv: input.meetingType,
          etape: input.pipelineStage,
          extraitTranscript: input.transcriptExcerpt,
          discResult: input.discResult,
          soncasResult: input.soncasResult,
          kissResult: input.kissResult,
        },
        null,
        2,
      ),
    ].join("\n");

    const { object } = await generateObject({
      model: input.model,
      system,
      schema: meetingDetailSynthesisSchema,
      prompt: userContent,
      maxOutputTokens: 700,
    });
    return object;
  }

  async prepareMeetingBriefing(input: {
    systemMarkdown: string;
    model: string;
    targetStage: string;
    prospectCompany: string;
    priorMeetingsJson: string;
    hasHistory: boolean;
  }) {
    const system = withDataScopeSystemPrompt(input.systemMarkdown);
    const userContent = [
      `Société prospect : ${input.prospectCompany}`,
      `Étape visée : ${input.targetStage}`,
      `Historique disponible : ${input.hasHistory ? "oui" : "non"}`,
      "",
      "Historique (JSON) :",
      input.priorMeetingsJson,
    ].join("\n");
    const { object } = await generateObject({
      model: input.model,
      schema: meetingBriefingSchema,
      system,
      prompt: userContent,
      maxOutputTokens: 900,
    });
    return { result: object };
  }
}
