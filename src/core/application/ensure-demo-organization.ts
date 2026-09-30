import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type {
  DemoOrganizationResult,
  DemoTenantPort,
} from "@/src/core/ports/demo-tenant-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

export type EnsureDemoOrganizationResult =
  | { ok: true; demo: DemoOrganizationResult }
  | { ok: false; error: "PROMPT_NOT_CONFIGURED" | "FAILED"; message: string };

/**
 * Crée l'organisation de démonstration quand elle manque.
 *
 * Les analyses de démo pointent vers une version de prompt : on s'assure
 * qu'elle existe pour chaque famille, comme le fait l'analyse réelle, plutôt
 * que d'exiger un seed préalable que personne ne lance en production.
 */
export async function ensureDemoOrganization(
  deps: {
    prompts: PromptTemplateRepositoryPort;
    demoTenant: DemoTenantPort;
    audit?: AuditRepositoryPort;
  },
  input: { actorUserId: string },
): Promise<EnsureDemoOrganizationResult> {
  const kinds = ["SONCAS", "DISC", "KISS"] as const;
  const versionIds: Partial<Record<(typeof kinds)[number], string>> = {};
  for (const kind of kinds) {
    const defaultMarkdown = DEFAULT_ANALYSIS_PROMPT_MARKDOWN[kind];
    if (!defaultMarkdown?.trim()) {
      return {
        ok: false,
        error: "PROMPT_NOT_CONFIGURED",
        message: `Aucun prompt par défaut pour ${kind}.`,
      };
    }
    const version = await deps.prompts.ensureCurrentVersion({
      kind,
      defaultMarkdown,
    });
    versionIds[kind] = version.id;
  }

  try {
    const demo = await deps.demoTenant.ensureDemoOrganization({
      promptVersions: {
        soncas: versionIds.SONCAS as string,
        disc: versionIds.DISC as string,
        kiss: versionIds.KISS as string,
      },
    });

    await deps.audit?.logPlatformAction({
      actorUserId: input.actorUserId,
      organizationId: demo.organizationId,
      action: "DEMO_ORG_ENSURED",
      reason: `${demo.memberCount} membres, ${demo.meetingCount} rendez-vous`,
    });

    return { ok: true, demo };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "FAILED", message };
  }
}
