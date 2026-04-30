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
// Line diff (LCS) + side-by-side rows
// ---------------------------------------------------------------------------
type DiffOp =
  | { kind: "equal"; oldIndex: number; newIndex: number }
  | { kind: "delete"; oldIndex: number }
  | { kind: "insert"; newIndex: number };

type SideBySideDiffRow = {
  oldLineNo: number | null;
  newLineNo: number | null;
  oldText: string | null;
  newText: string | null;
  /** Single row replacing adjacent delete+insert (same visual row) */
  rowKind: "unchanged" | "added-only" | "removed-only" | "replaced";
};

/** Myers-style line diff via LCS backtrack — correct for reordered / inserted blocks */
function computeDiffOps(oldLines: string[], newLines: string[]): DiffOp[] {
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ kind: "equal", oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ kind: "insert", newIndex: j - 1 });
      j--;
    } else {
      ops.push({ kind: "delete", oldIndex: i - 1 });
      i--;
    }
  }
  ops.reverse();
  return ops;
}

/** Pair adjacent delete+insert into one side-by-side "replaced" row when possible */
function opsToSideBySideRows(oldLines: string[], newLines: string[]): SideBySideDiffRow[] {
  const ops = computeDiffOps(oldLines, newLines);
  const rows: SideBySideDiffRow[] = [];
  let k = 0;
  while (k < ops.length) {
    const cur = ops[k];
    const next = ops[k + 1];
    if (cur.kind === "delete" && next?.kind === "insert") {
      rows.push({
        oldLineNo: cur.oldIndex + 1,
        newLineNo: next.newIndex + 1,
        oldText: oldLines[cur.oldIndex],
        newText: newLines[next.newIndex],
        rowKind: "replaced",
      });
      k += 2;
      continue;
    }
    if (cur.kind === "equal") {
      rows.push({
        oldLineNo: cur.oldIndex + 1,
        newLineNo: cur.newIndex + 1,
        oldText: oldLines[cur.oldIndex],
        newText: newLines[cur.newIndex],
        rowKind: "unchanged",
      });
    } else if (cur.kind === "delete") {
      rows.push({
        oldLineNo: cur.oldIndex + 1,
        newLineNo: null,
        oldText: oldLines[cur.oldIndex],
        newText: null,
        rowKind: "removed-only",
      });
    } else {
      rows.push({
        oldLineNo: null,
        newLineNo: cur.newIndex + 1,
        oldText: null,
        newText: newLines[cur.newIndex],
        rowKind: "added-only",
      });
    }
    k++;
  }
  return rows;
}

function computeSideBySideDiff(oldText: string, newText: string): SideBySideDiffRow[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  return opsToSideBySideRows(oldLines, newLines);
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

  const diffRows = useMemo(
    () => (diffVersion ? computeSideBySideDiff(diffVersion.markdown, markdown) : null),
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

      {/* Diff view — side by side with line numbers */}
      {diffRows && diffVersion && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-medium">
                Diff — v{diffVersion.version} → brouillon actuel
              </h4>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Colonne gauche : version publiée. Colonne droite : éditeur actuel.
              </p>
            </div>
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
          <div className="flex flex-wrap gap-3 text-[11px] leading-tight">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-sm bg-emerald-500/35 ring-1 ring-emerald-600/30" />
              Ajouté
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-sm bg-rose-500/35 ring-1 ring-rose-600/30" />
              Supprimé
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-sm bg-muted ring-1 ring-border" />
              Inchangé
            </span>
          </div>
          <div className="overflow-hidden rounded-md border">
            <div className="bg-muted/40 text-muted-foreground grid max-h-[min(70vh,520px)] grid-cols-2 divide-x border-b text-[10px] font-medium tracking-wide uppercase">
              <div className="flex min-h-8 items-center gap-2 px-2 py-1.5">
                <span className="text-foreground/80 shrink-0">v{diffVersion.version}</span>
                <span className="truncate font-normal normal-case">référence</span>
              </div>
              <div className="flex min-h-8 items-center gap-2 px-2 py-1.5">
                <span className="text-foreground/80 shrink-0">Brouillon</span>
                <span className="truncate font-normal normal-case">modifications</span>
              </div>
            </div>
            <div className="max-h-[min(70vh,520px)] overflow-auto">
              <div className="divide-y divide-border/60">
                {diffRows.map((row, i) => {
                  const leftHighlight =
                    row.rowKind === "removed-only" || row.rowKind === "replaced";
                  const rightHighlight =
                    row.rowKind === "added-only" || row.rowKind === "replaced";
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-2 font-mono text-xs leading-snug"
                    >
                      <div
                        className={cn(
                          "flex min-h-[1.375rem] min-w-0",
                          leftHighlight &&
                            "bg-rose-500/12 text-rose-950 dark:bg-rose-500/15 dark:text-rose-100",
                          !leftHighlight && row.oldText !== null && "bg-background",
                          row.oldText === null && "bg-muted/25",
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 shrink-0 select-none border-r border-border/50 py-0.5 pr-1.5 text-right tabular-nums",
                            leftHighlight
                              ? "text-rose-700/90 dark:text-rose-300/90"
                              : "text-muted-foreground",
                          )}
                        >
                          {row.oldLineNo ?? ""}
                        </div>
                        <div className="min-w-0 flex-1 whitespace-pre-wrap break-words px-2 py-0.5">
                          {row.oldText === null ? (
                            <span className="text-muted-foreground/35 select-none">·</span>
                          ) : (
                            row.oldText || "\u00A0"
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex min-h-[1.375rem] min-w-0",
                          rightHighlight &&
                            "bg-emerald-500/12 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100",
                          !rightHighlight && row.newText !== null && "bg-background",
                          row.newText === null && "bg-muted/25",
                        )}
                      >
                        <div
                          className={cn(
                            "w-11 shrink-0 select-none border-r border-border/50 py-0.5 pr-1.5 text-right tabular-nums",
                            rightHighlight
                              ? "text-emerald-800/90 dark:text-emerald-300/90"
                              : "text-muted-foreground",
                          )}
                        >
                          {row.newLineNo ?? ""}
                        </div>
                        <div className="min-w-0 flex-1 whitespace-pre-wrap break-words px-2 py-0.5">
                          {row.newText === null ? (
                            <span className="text-muted-foreground/35 select-none">·</span>
                          ) : (
                            row.newText || "\u00A0"
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
