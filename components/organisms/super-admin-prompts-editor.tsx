"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Eye,
  EyeOff,
  ArrowUpFromLine,
  RotateCcw,
  GitCompareArrows,
  X,
} from "lucide-react";
import { publishPromptAction } from "@/app/[locale]/admin/prompts/actions";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type VersionRow = {
  id: string;
  version: number;
  markdown: string;
  authorUserId: string;
  authorEmail: string | null;
  createdAt: string;
};

type Props = {
  kind: AnalysisKindSlug;
  initialMarkdown: string;
  versions: VersionRow[];
};

// ---------------------------------------------------------------------------
// Lightweight markdown → HTML (no external dependency)
// ---------------------------------------------------------------------------
function renderMarkdownToHtml(md: string): string {
  let html = "";
  const lines = md.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inList: "ul" | "ol" | null = null;

  const flushList = () => {
    if (inList) {
      html += inList === "ul" ? "</ul>" : "</ol>";
      inList = null;
    }
  };

  const inlineFormat = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto my-2"><code>${codeBuffer.join("\n")}</code></pre>`;
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }

    if (line.trim() === "") {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const sizes = ["text-xl font-bold", "text-lg font-semibold", "text-base font-semibold", "text-sm font-semibold"];
      html += `<h${level} class="${sizes[level - 1]} mt-3 mb-1">${inlineFormat(headingMatch[2])}</h${level}>`;
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inList !== "ul") {
        flushList();
        html += '<ul class="list-disc pl-5 space-y-0.5">';
        inList = "ul";
      }
      html += `<li>${inlineFormat(ulMatch[1])}</li>`;
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inList !== "ol") {
        flushList();
        html += '<ol class="list-decimal pl-5 space-y-0.5">';
        inList = "ol";
      }
      html += `<li>${inlineFormat(olMatch[1])}</li>`;
      continue;
    }

    flushList();
    html += `<p class="my-1">${inlineFormat(line)}</p>`;
  }

  flushList();
  if (inCodeBlock && codeBuffer.length > 0) {
    html += `<pre class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto my-2"><code>${codeBuffer.join("\n")}</code></pre>`;
  }

  return html;
}

// ---------------------------------------------------------------------------
// Simple line-diff
// ---------------------------------------------------------------------------
type DiffLine = { type: "added" | "removed" | "unchanged"; text: string };

function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const result: DiffLine[] = [];

  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === undefined) {
      result.push({ type: "added", text: n });
    } else if (n === undefined) {
      result.push({ type: "removed", text: o });
    } else if (o === n) {
      result.push({ type: "unchanged", text: o });
    } else {
      result.push({ type: "removed", text: o });
      result.push({ type: "added", text: n });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SuperAdminPromptsEditor({
  kind,
  initialMarkdown,
  versions,
}: Props) {
  const router = useRouter();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [diffVersion, setDiffVersion] = useState<VersionRow | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions],
  );

  const latestVersion = sorted[0]?.version ?? 0;

  const charCount = markdown.length;
  const lineCount = markdown.split("\n").length;

  const previewHtml = useMemo(
    () => (showPreview ? renderMarkdownToHtml(markdown) : ""),
    [showPreview, markdown],
  );

  const diffLines = useMemo(
    () => (diffVersion ? computeDiff(diffVersion.markdown, markdown) : null),
    [diffVersion, markdown],
  );

  const doPublish = useCallback(
    (sourceMarkdown: string, auditAction: "PUBLISH_PROMPT" | "RESTORE_PROMPT") => {
      setError(null);
      startTransition(async () => {
        const res = await publishPromptAction({
          kind,
          markdown: sourceMarkdown,
          auditAction,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        if (auditAction === "RESTORE_PROMPT") {
          setMarkdown(sourceMarkdown);
        }
        router.refresh();
      });
    },
    [kind, router],
  );

  return (
    <div className="space-y-4">
      {/* Editor + Preview side-by-side */}
      <div className={cn("grid gap-4", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
        {/* Editor column */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`md-${kind}`} className="text-sm font-medium">
              Éditeur Markdown
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview((p) => !p)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="mr-1.5 size-3.5" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="mr-1.5 size-3.5" />
                  Prévisualisation
                </>
              )}
            </Button>
          </div>
          <Textarea
            id={`md-${kind}`}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={22}
            className="font-mono text-xs leading-relaxed"
          />
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span>{charCount.toLocaleString("fr-FR")} caractères</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{lineCount.toLocaleString("fr-FR")} lignes</span>
          </div>
        </div>

        {/* Preview column */}
        {showPreview && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Prévisualisation</Label>
            <div
              className="prose prose-sm dark:prose-invert max-h-[520px] overflow-y-auto rounded-lg border p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {/* Publish button */}
      <Button
        type="button"
        disabled={pending}
        onClick={() => setPublishDialogOpen(true)}
      >
        <ArrowUpFromLine className="mr-1.5 size-3.5" />
        {pending ? "Publication…" : "Publier une nouvelle version"}
      </Button>

      {/* Publish confirmation dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la publication</DialogTitle>
            <DialogDescription>
              Vous allez publier la version <strong>v{latestVersion + 1}</strong> du
              prompt <strong>{kind}</strong>. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                setPublishDialogOpen(false);
                doPublish(markdown, "PUBLISH_PROMPT");
              }}
            >
              {pending ? "Publication…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diff view */}
      {diffLines && diffVersion && (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Diff — v{diffVersion.version} → brouillon actuel
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDiffVersion(null)}
            >
              <X className="mr-1 size-3.5" />
              Fermer
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-md border bg-black/[0.02] font-mono text-xs dark:bg-white/[0.02]">
            {diffLines.map((dl, i) => (
              <div
                key={i}
                className={cn(
                  "whitespace-pre-wrap px-3 py-0.5",
                  dl.type === "added" && "bg-green-500/10 text-green-700 dark:text-green-400",
                  dl.type === "removed" && "bg-red-500/10 text-red-700 line-through dark:text-red-400",
                  dl.type === "unchanged" && "text-muted-foreground",
                )}
              >
                <span className="mr-2 inline-block w-4 select-none text-right opacity-50">
                  {dl.type === "added" ? "+" : dl.type === "removed" ? "−" : " "}
                </span>
                {dl.text || "\u00A0"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version history */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Historique des versions</h3>
        <ul className="max-h-[480px] space-y-2 overflow-y-auto rounded-lg border p-2">
          {sorted.map((v) => (
            <li
              key={v.id}
              className="bg-muted/30 space-y-2 rounded-md border p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="tabular-nums">
                    v{v.version}
                  </Badge>
                  <span className="text-muted-foreground">
                    {v.authorEmail ?? v.authorUserId}
                  </span>
                </div>
                <span className="text-muted-foreground shrink-0">
                  {new Date(v.createdAt).toLocaleString("fr-FR")}
                </span>
              </div>

              {/* Preview snippet */}
              <p className="text-muted-foreground truncate font-mono text-[11px]">
                {v.markdown.slice(0, 100)}
                {v.markdown.length > 100 ? "…" : ""}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    doPublish(v.markdown, "RESTORE_PROMPT");
                  }}
                >
                  <RotateCcw className="mr-1 size-3" />
                  Restaurer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDiffVersion((prev) => (prev?.id === v.id ? null : v))
                  }
                >
                  <GitCompareArrows className="mr-1 size-3" />
                  {diffVersion?.id === v.id ? "Masquer diff" : "Voir le diff"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
