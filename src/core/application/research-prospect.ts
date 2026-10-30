import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { organizationPlaybookMarkdownForAnalysis } from "@/lib/organization-playbook-for-analysis";
import {
  PROSPECT_RESEARCH_SYSTEM_PROMPT,
  PROSPECT_WEB_RESEARCH_MODEL,
  prospectWebResearchPrompt,
} from "@/lib/prospect-research-prompt";
import { withProvableAnswers } from "@/src/core/domain/likely-objection-proof";
import { organizationPlaybookFromJson } from "@/src/core/domain/organization-playbook";
import {
  cleanSources,
  prospectResearchSchema,
  type ProspectResearch,
} from "@/src/core/domain/prospect-research";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import { reuseAnalysisOutput } from "./reuse-analysis-output";

export type ResearchProspectInput = {
  organizationId: string;
  companyName: string;
  website: string | null;
  personName: string | null;
  personRole: string | null;
  linkedinUrl: string | null;
  /** Le texte du profil LinkedIn collé par le commercial, que l'outil ne peut pas lire seul. */
  profileText: string | null;
  targetStage: string;
};

export type ResearchProspectResult =
  | { ok: true; research: ProspectResearch; sources: string[] }
  | { ok: false; error: "AI_NOT_CONFIGURED" | "FAILED" };

/** La recherche web se refait au plus une fois par jour pour les mêmes entrées. */
function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Prépare un premier rendez-vous avec un prospect dont on sait peu de choses.
 *
 * Deux temps, comme la méthode Seed de Sinéa : un modèle qui cherche sur le web
 * rassemble les faits avec leurs sources, puis le coach les range en fiche
 * (contexte, décideur, douleur, plan d'attaque, clients similaires). Les deux
 * réponses sont gardées pour la journée : relancer la même préparation ne
 * coûte rien.
 */
export async function researchProspect(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    organizationSettings: Pick<
      OrganizationSettingsRepositoryPort,
      "findByOrganizationId"
    >;
    aiSummaryCache?: AiSummaryCacheRepositoryPort;
  },
  input: ResearchProspectInput,
  now: Date = new Date(),
): Promise<ResearchProspectResult> {
  if (!getEnv().AI_GATEWAY_API_KEY) {
    return { ok: false, error: "AI_NOT_CONFIGURED" };
  }

  try {
    const [settings, model] = await Promise.all([
      deps.organizationSettings.findByOrganizationId(input.organizationId),
      resolvePromptGatewayModel(deps.prompts, "MEETING_BRIEFING"),
    ]);
    const playbook = organizationPlaybookMarkdownForAnalysis(settings);
    const references = organizationPlaybookFromJson(
      settings?.playbook,
    ).clientReferences;

    const webPrompt = prospectWebResearchPrompt(input);
    const { value: web } = await reuseAnalysisOutput(deps, {
      organizationId: input.organizationId,
      kind: "PROSPECT_WEB_RESEARCH",
      model: PROSPECT_WEB_RESEARCH_MODEL,
      systemPrompt: "",
      userPrompt: `${dayKey(now)}\n${webPrompt}`,
      compute: () =>
        deps.analysis.researchOnWeb({
          model: PROSPECT_WEB_RESEARCH_MODEL,
          prompt: webPrompt,
        }),
    });

    const userPrompt = [
      playbook ? playbook : "(Pas de playbook renseigné pour l'organisation.)",
      "",
      `Prospect : ${input.companyName}${input.website ? ` (${input.website})` : ""}`,
      input.personName
        ? `Interlocuteur : ${input.personName}${input.personRole ? `, ${input.personRole}` : ""}`
        : "Interlocuteur : non précisé",
      `Étape du rendez-vous à préparer : ${input.targetStage}`,
      "",
      "<recherche_web>",
      web.text.trim(),
      "</recherche_web>",
      input.profileText?.trim()
        ? `\n<profil_colle>\n${input.profileText.trim().slice(0, 6000)}\n</profil_colle>`
        : "",
      references.length
        ? `\n<references_clients>\n${references.map((r) => `- ${r}`).join("\n")}\n</references_clients>`
        : "",
    ].join("\n");

    const { value } = await reuseAnalysisOutput(deps, {
      organizationId: input.organizationId,
      kind: "PROSPECT_RESEARCH",
      model,
      systemPrompt: PROSPECT_RESEARCH_SYSTEM_PROMPT,
      userPrompt,
      compute: () =>
        deps.analysis.structureProspectResearch({
          systemPrompt: PROSPECT_RESEARCH_SYSTEM_PROMPT,
          model,
          userPrompt,
        }),
    });
    const parsed = prospectResearchSchema.safeParse(value);
    if (!parsed.success) return { ok: false, error: "FAILED" };
    return {
      ok: true,
      research: {
        ...parsed.data,
        attackPlan: {
          ...parsed.data.attackPlan,
          likelyObjections: withProvableAnswers(
            parsed.data.attackPlan.likelyObjections,
          ),
        },
      },
      sources: cleanSources(web.sources),
    };
  } catch {
    return { ok: false, error: "FAILED" };
  }
}
