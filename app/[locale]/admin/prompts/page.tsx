import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SuperAdminPromptsEditor } from "@/components/organisms/super-admin-prompts-editor";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { makeApplicationDeps } from "@/src/adapters/composition";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

export const dynamic = "force-dynamic";

async function loadPromptTab(kind: AnalysisKindSlug) {
  const deps = makeApplicationDeps();
  const current = await deps.prompts.getCurrentVersion({ kind });
  const versions = await deps.prompts.listVersions({ kind, limit: 30 });

  const authorIds = [...new Set(versions.map((v) => v.authorUserId))];
  const emailMap = new Map<string, string | null>();
  await Promise.all(
    authorIds.map(async (id) => {
      const user = await deps.users.findById(id);
      emailMap.set(id, user?.email ?? null);
    }),
  );

  const initialMarkdown =
    current?.markdown ??
    "(Aucun prompt — exécutez `npx prisma db seed` avec CLERK_USER_ID.)";

  return {
    initialMarkdown,
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

const TAB_META: Record<AnalysisKindSlug, { label: string; description: string }> = {
  SONCAS: {
    label: "SONCAS",
    description: "Instructions système pour l'analyse SONCAS",
  },
  DISC: {
    label: "DISC",
    description: "Instructions système pour l'analyse DISC",
  },
  KISS: {
    label: "KISS",
    description: "Instructions système pour l'analyse KISS (Keep / Improve / Stop / Start)",
  },
};

export default async function SuperAdminPromptsPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") redirect("/sign-in");
  if (!actor.systemRoles.includes("SUPER_ADMIN")) {
    redirect("/company");
  }

  const [soncas, disc, kiss] = await Promise.all([
    loadPromptTab("SONCAS"),
    loadPromptTab("DISC"),
    loadPromptTab("KISS"),
  ]);

  const tabs: { kind: AnalysisKindSlug; data: typeof soncas }[] = [
    { kind: "SONCAS", data: soncas },
    { kind: "DISC", data: disc },
    { kind: "KISS", data: kiss },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Éditeur de prompts
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Markdown versionné pour chaque méthode d'analyse. Chaque publication
          crée une nouvelle version avec un audit super admin.
        </p>
      </div>

      <Tabs defaultValue="SONCAS">
        <TabsList>
          {tabs.map(({ kind, data }) => (
            <TabsTrigger key={kind} value={kind}>
              {TAB_META[kind].label}
              <Badge variant="secondary" className="ml-1.5 tabular-nums">
                {data.versionCount}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ kind, data }) => (
          <TabsContent key={kind} value={kind} className="pt-4">
            <div className="mb-4">
              <p className="text-muted-foreground text-sm">
                {TAB_META[kind].description}
              </p>
            </div>
            <SuperAdminPromptsEditor
              kind={kind}
              initialMarkdown={data.initialMarkdown}
              versions={data.versions}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
