import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SuperAdminPromptsEditor } from "@/components/organisms/super-admin-prompts-editor";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { makeApplicationDeps } from "@/src/adapters/composition";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

export const dynamic = "force-dynamic";

async function loadPromptTab(kind: AnalysisKindSlug) {
  const deps = makeApplicationDeps();
  const current = await deps.prompts.getCurrentVersion({ kind });
  const versions = await deps.prompts.listVersions({ kind, limit: 30 });

  const initialMarkdown =
    current?.markdown ??
    "(Aucun prompt — exécutez `npx prisma db seed` avec CLERK_USER_ID.)";

  return {
    initialMarkdown,
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      markdown: v.markdown,
      authorUserId: v.authorUserId,
      createdAt: v.createdAt.toISOString(),
    })),
  };
}

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Prompts d’analyse (global)
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Markdown versionné pour SONCAS, DISC et KISS. Chaque publication crée
          une nouvelle version et une entrée d’audit super admin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SONCAS</CardTitle>
          <CardDescription>Instructions système pour l’analyse SONCAS</CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminPromptsEditor
            kind="SONCAS"
            initialMarkdown={soncas.initialMarkdown}
            versions={soncas.versions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DISC</CardTitle>
          <CardDescription>Instructions système pour l’analyse DISC</CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminPromptsEditor
            kind="DISC"
            initialMarkdown={disc.initialMarkdown}
            versions={disc.versions}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">KISS</CardTitle>
          <CardDescription>
            Instructions système pour l’analyse KISS (Keep / Improve / Stop /
            Start)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SuperAdminPromptsEditor
            kind="KISS"
            initialMarkdown={kiss.initialMarkdown}
            versions={kiss.versions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
