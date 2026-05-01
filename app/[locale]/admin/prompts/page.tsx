import { FileCode2, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SuperAdminPromptsEditor } from "@/components/organisms/super-admin-prompts-editor";
import { Link } from "@/i18n/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { cardTitleClass, pageTitleClass } from "@/lib/page-typography";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

export const dynamic = "force-dynamic";

async function loadPromptTab(kind: AnalysisKindSlug) {
  const deps = getApplicationDeps();
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
    current?.markdown ?? "(Aucun prompt — exécutez `npx prisma db seed`.)";

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

const TAB_META: Record<AnalysisKindSlug, { label: string }> = {
  SONCAS: { label: "SONCAS" },
  DISC: { label: "DISC" },
  KISS: { label: "KISS" },
};

export default async function SuperAdminPromptsPage() {
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
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="bg-primary/8 ring-border/60 flex size-12 shrink-0 items-center justify-center rounded-xl ring-1">
            <FileCode2 className="text-primary size-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Super admin
            </p>
            <h1 className={pageTitleClass}>Éditeur de prompts</h1>
          </div>
        </div>
      </div>

      <Card className="border-brand/25 bg-brand/5">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="bg-background/80 flex size-10 shrink-0 items-center justify-center rounded-lg border">
            <Sparkles className="text-brand size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className={cardTitleClass}>
              Consignes KISS par quadrant
            </CardTitle>
            <CardDescription className="text-pretty">
              Textes optionnels global / manager / commercial pour enrichir
              l’analyse KISS des RDV et les synthèses manager — distincts des
              prompts SONCAS / DISC / KISS ci-dessous.
            </CardDescription>
            <p className="pt-2">
              <Link
                href="/admin/prompts/kiss-consignes"
                className="text-brand text-sm font-medium underline underline-offset-2"
              >
                Ouvrir l’éditeur →
              </Link>
            </p>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="SONCAS" className="gap-6">
        <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 gap-1 p-1 sm:inline-flex sm:w-auto sm:max-w-md">
          {tabs.map(({ kind, data }) => (
            <TabsTrigger key={kind} value={kind} className="px-3 py-2">
              <span className="truncate">{TAB_META[kind].label}</span>
              <Badge
                variant="secondary"
                className="ml-1.5 shrink-0 tabular-nums sm:ml-2"
              >
                {data.versionCount}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(({ kind, data }) => (
          <TabsContent key={kind} value={kind} className="mt-6">
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
