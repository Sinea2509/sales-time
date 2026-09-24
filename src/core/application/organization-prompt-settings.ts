import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import {
  checkOrganizationPromptMarkdown,
  isOrganizationPromptKind,
  ORGANIZATION_PROMPT_KINDS,
  ORGANIZATION_PROMPT_TITLES,
  pickPromptMarkdown,
  type OrganizationPromptKind,
} from "@/src/core/domain/organization-prompts";
import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { OrganizationPromptRepositoryPort } from "@/src/core/ports/organization-prompt-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

/** Une carte de Paramètres, Coach IA. */
export type OrganizationPromptCard = {
  kind: OrganizationPromptKind;
  /** La consigne en vigueur pour l'organisation : la sienne, ou celle d'origine. */
  markdown: string;
  /** Le numéro de la version du super admin ; null quand il n'en a publié aucune. */
  originVersion: number | null;
  /** La modification en vigueur ; null quand la consigne est celle d'origine. */
  modified: { at: Date; authorName: string | null } | null;
};

/**
 * Les six consignes telles que l'organisation les a en ce moment.
 *
 * La consigne d'origine est la version courante du super admin, ou celle du
 * code quand il n'en a publié aucune : exactement ce qu'une analyse
 * recevrait, puisque la règle est la même (`pickPromptMarkdown`).
 */
export async function loadOrganizationPromptCards(
  deps: {
    prompts: PromptTemplateRepositoryPort;
    organizationPrompts: OrganizationPromptRepositoryPort;
  },
  input: { organizationId: string },
): Promise<OrganizationPromptCard[]> {
  const [latestRows, globalVersions] = await Promise.all([
    deps.organizationPrompts.listLatest({
      organizationId: input.organizationId,
    }),
    Promise.all(
      ORGANIZATION_PROMPT_KINDS.map((kind) =>
        deps.prompts.getCurrentVersion({ kind }),
      ),
    ),
  ]);

  return ORGANIZATION_PROMPT_KINDS.map((kind, index) => {
    const globalVersion = globalVersions[index];
    const latest = latestRows.find((row) => row.kind === kind) ?? null;
    const picked = pickPromptMarkdown({
      organizationMarkdown: latest?.markdown,
      globalMarkdown: globalVersion?.markdown,
      codeMarkdown: DEFAULT_ANALYSIS_PROMPT_MARKDOWN[kind],
    });
    return {
      kind,
      markdown: picked.markdown,
      originVersion: globalVersion?.version ?? null,
      modified:
        picked.source === "organization" && latest
          ? { at: latest.createdAt, authorName: latest.authorName }
          : null,
    };
  });
}

export type OrganizationPromptChangeResult =
  | { ok: true; changed: boolean }
  | { ok: false; message: string };

const NOT_EDITABLE_MESSAGE = "Cette consigne ne se règle pas par organisation.";

/**
 * Enregistre la consigne d'un manager, en nouvelle version.
 *
 * Un texte identique à la consigne en vigueur n'ajoute rien : ni ligne, ni
 * entrée au journal d'audit. Sans cette garde, ouvrir la fenêtre et
 * enregistrer sans rien changer figerait la consigne d'origine du jour, et
 * l'organisation ne recevrait plus les améliorations du super admin.
 */
export async function saveOrganizationPrompt(
  deps: {
    prompts: PromptTemplateRepositoryPort;
    organizationPrompts: OrganizationPromptRepositoryPort;
    audit: AuditRepositoryPort;
  },
  input: {
    organizationId: string;
    actorUserId: string;
    kind: string;
    markdown: string;
  },
): Promise<OrganizationPromptChangeResult> {
  const { kind } = input;
  if (!isOrganizationPromptKind(kind)) {
    return { ok: false, message: NOT_EDITABLE_MESSAGE };
  }
  const checked = checkOrganizationPromptMarkdown(input.markdown);
  if (!checked.ok) return checked;

  const [latest, globalVersion] = await Promise.all([
    deps.organizationPrompts.findLatest({
      organizationId: input.organizationId,
      kind,
    }),
    deps.prompts.getCurrentVersion({ kind }),
  ]);
  const inForce = pickPromptMarkdown({
    organizationMarkdown: latest?.markdown,
    globalMarkdown: globalVersion?.markdown,
    codeMarkdown: DEFAULT_ANALYSIS_PROMPT_MARKDOWN[kind],
  });
  if (inForce.markdown.trim() === checked.markdown) {
    return { ok: true, changed: false };
  }

  await deps.organizationPrompts.append({
    organizationId: input.organizationId,
    kind,
    markdown: checked.markdown,
    authorUserId: input.actorUserId,
  });
  await deps.audit.logPlatformAction({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "ORG_PROMPT_UPDATED",
    reason: `${ORGANIZATION_PROMPT_TITLES[kind]} : nouvelle version de la consigne (${checked.markdown.length} caractères)`,
  });
  return { ok: true, changed: true };
}

/**
 * Rend à l'organisation la consigne d'origine de Sales Time.
 *
 * Une ligne sans texte est ajoutée, et rien n'est effacé : les versions du
 * manager restent dans l'historique. Sur une consigne déjà d'origine, rien
 * ne se passe.
 */
export async function resetOrganizationPrompt(
  deps: {
    organizationPrompts: OrganizationPromptRepositoryPort;
    audit: AuditRepositoryPort;
  },
  input: { organizationId: string; actorUserId: string; kind: string },
): Promise<OrganizationPromptChangeResult> {
  const { kind } = input;
  if (!isOrganizationPromptKind(kind)) {
    return { ok: false, message: NOT_EDITABLE_MESSAGE };
  }
  const latest = await deps.organizationPrompts.findLatest({
    organizationId: input.organizationId,
    kind,
  });
  if (!latest?.markdown?.trim()) {
    return { ok: true, changed: false };
  }

  await deps.organizationPrompts.append({
    organizationId: input.organizationId,
    kind,
    markdown: null,
    authorUserId: input.actorUserId,
  });
  await deps.audit.logPlatformAction({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "ORG_PROMPT_RESET",
    reason: `${ORGANIZATION_PROMPT_TITLES[kind]} : consigne d'origine rétablie`,
  });
  return { ok: true, changed: true };
}
