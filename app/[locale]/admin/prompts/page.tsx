import { FileCode2 } from "lucide-react";
import { SuperAdminPromptsShell } from "@/components/organisms/super-admin-prompts-shell";
import { PageHeader } from "@/components/molecules/page-header";
import { getApplicationDeps } from "@/lib/application-deps";
import { ALL_ANALYSIS_PROMPT_KINDS } from "@/lib/analysis-prompt-kinds";
import {
  ANALYSIS_KIND_SLUGS,
  type AnalysisKindSlug,
} from "@/src/core/ports/prompt-template-repository-port";

export const dynamic = "force-dynamic";

type SuperAdminPromptsPageProps = {
  searchParams?: Promise<{ kind?: string }>;
};

function parsePromptKind(raw: string | undefined): AnalysisKindSlug {
  if (
    raw != null &&
    (ANALYSIS_KIND_SLUGS as readonly string[]).includes(raw)
  ) {
    return raw as AnalysisKindSlug;
  }
  return "SONCAS";
}

async function loadPromptPanel(kind: AnalysisKindSlug) {
  const deps = getApplicationDeps();
  const [current, versions, initialModel] = await Promise.all([
    deps.prompts.getCurrentVersion({ kind }),
    deps.prompts.listVersions({ kind, limit: 30 }),
    deps.prompts.getModelForKind({ kind }),
  ]);

  const authorIds = [...new Set(versions.map((v) => v.authorUserId))];
  const emailMap = new Map<string, string | null>();
  await Promise.all(
    authorIds.map(async (id) => {
      const user = await deps.users.findById(id);
      emailMap.set(id, user?.email ?? null);
    }),
  );

  const initialMarkdown =
    current?.markdown ?? "(Aucun prompt — exécutez `npx prisma db seed`.)";

  return {
    kind,
    initialMarkdown,
    initialModel,
    versionCount: versions.length,
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      markdown: v.markdown,
      authorUserId: v.authorUserId,
      authorEmail: emailMap.get(v.authorUserId) ?? null,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

export default async function SuperAdminPromptsPage({
  searchParams,
}: SuperAdminPromptsPageProps) {
  const sp = searchParams != null ? await searchParams : {};
  const initialKind = parsePromptKind(sp.kind);

  const panels = await Promise.all(
    ALL_ANALYSIS_PROMPT_KINDS.map((kind) => loadPromptPanel(kind)),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Super admin"
        icon={FileCode2}
        title="Éditeur de prompts"
        description="Tous les prompts système utilisés par les analyses et synthèses IA de la plateforme."
      />

      <SuperAdminPromptsShell panels={panels} initialKind={initialKind} />
    </div>
  );
}
