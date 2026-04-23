"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { publishPromptAction } from "@/app/[locale]/admin/prompts/actions";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
type VersionRow = {
  id: string;
  version: number;
  markdown: string;
  authorUserId: string;
  createdAt: string;
};

type Props = {
  kind: AnalysisKindSlug;
  initialMarkdown: string;
  versions: VersionRow[];
};

export function SuperAdminPromptsEditor({
  kind,
  initialMarkdown,
  versions,
}: Props) {
  const router = useRouter();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`md-${kind}`}>Markdown — {kind}</Label>
          <Textarea
            id={`md-${kind}`}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={22}
            className="font-mono text-xs"
          />
        </div>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await publishPromptAction({
                kind,
                markdown,
                auditAction: "PUBLISH_PROMPT",
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.refresh();
            });
          }}
        >
          {pending ? "Publication…" : "Publier une nouvelle version"}
        </Button>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Historique des versions</h3>
        <ul className="max-h-[520px] space-y-2 overflow-y-auto rounded-lg border p-2">
          {sorted.map((v) => (
            <li
              key={v.id}
              className="bg-muted/30 space-y-2 rounded-md border p-3 text-xs"
            >
              <div className="text-muted-foreground flex justify-between">
                <span>v{v.version}</span>
                <span>{new Date(v.createdAt).toLocaleString()}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const res = await publishPromptAction({
                      kind,
                      markdown: v.markdown,
                      auditAction: "RESTORE_PROMPT",
                    });
                    if (!res.ok) {
                      setError(res.error);
                      return;
                    }
                    setMarkdown(v.markdown);
                    router.refresh();
                  });
                }}
              >
                Restaurer (nouvelle version)
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
