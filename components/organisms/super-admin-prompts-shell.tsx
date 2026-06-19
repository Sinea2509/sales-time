"use client";

import { useCallback, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { SuperAdminPromptsEditor } from "@/components/organisms/super-admin-prompts-editor";
import { Badge } from "@/components/ui/badge";
import { SectionSubnav } from "@/components/molecules/section-subnav";
import {
  ANALYSIS_PROMPT_SECTIONS,
  ANALYSIS_PROMPT_TAB_META,
} from "@/lib/analysis-prompt-kinds";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

type VersionRow = {
  id: string;
  version: number;
  markdown: string;
  authorUserId: string;
  authorEmail: string | null;
  createdAt: string;
};

export type SuperAdminPromptPanel = {
  kind: AnalysisKindSlug;
  initialMarkdown: string;
  initialModel: string;
  versionCount: number;
  versions: VersionRow[];
};

type Props = {
  panels: SuperAdminPromptPanel[];
  initialKind: AnalysisKindSlug;
};

export function SuperAdminPromptsShell({ panels, initialKind }: Props) {
  const router = useRouter();
  const panelByKind = Object.fromEntries(
    panels.map((panel) => [panel.kind, panel]),
  ) as Record<AnalysisKindSlug, SuperAdminPromptPanel>;

  const [selectedKind, setSelectedKind] = useState<AnalysisKindSlug>(
    panelByKind[initialKind] ? initialKind : "SONCAS",
  );

  const selectKind = useCallback(
    (kind: AnalysisKindSlug) => {
      setSelectedKind(kind);
      router.replace(`/admin/prompts?kind=${kind}`, { scroll: false });
    },
    [router],
  );

  const selected = panelByKind[selectedKind];
  const meta = ANALYSIS_PROMPT_TAB_META[selectedKind];

  const sections = useMemo(
    () =>
      ANALYSIS_PROMPT_SECTIONS.map((section) => ({
        label: section.label,
        items: section.kinds.map((kind) => ({
          id: kind,
          label: ANALYSIS_PROMPT_TAB_META[kind].label,
          active: selectedKind === kind,
          onSelect: () => selectKind(kind),
          badge: (
            <Badge
              variant={selectedKind === kind ? "outline" : "secondary"}
              className={cn(
                "shrink-0 tabular-nums",
                selectedKind === kind &&
                  "border-primary-foreground/30 text-primary-foreground",
              )}
            >
              {panelByKind[kind].versionCount}
            </Badge>
          ),
        })),
      })),
    [panelByKind, selectKind, selectedKind],
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <SectionSubnav
        ariaLabel="Types de prompts"
        sections={sections}
        footer={
          <Link
            href="/admin/prompts/kiss-consignes"
            className="text-muted-foreground hover:text-foreground flex items-start gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
          >
            <Sparkles className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="text-foreground block font-medium">
                Consignes KISS
              </span>
              <span className="text-xs leading-snug">
                Quadrants global / manager / commercial
              </span>
            </span>
          </Link>
        }
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-1">
          <h2 className={cardTitleClass}>{meta.label}</h2>
          <p className="text-muted-foreground text-sm text-pretty">
            {meta.description}
          </p>
        </div>

        <SuperAdminPromptsEditor
          key={selectedKind}
          kind={selectedKind}
          initialMarkdown={selected.initialMarkdown}
          initialModel={selected.initialModel}
          versions={selected.versions}
        />
      </div>
    </div>
  );
}
