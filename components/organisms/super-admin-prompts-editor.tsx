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
  AlertCircle,
  History,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
  const isDirty = markdown !== initialMarkdown;
  /** First publication when no history row exists yet */
  const canPublish = isDirty || sorted.length === 0;

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
    <div className="space-y-6">
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/20 border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Brouillon — {kind}
              </CardTitle>
              <CardDescription>
                Contenu utilisé pour les prochaines analyses jusqu&apos;à publication
                d&apos;une nouvelle version.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isDirty ? (
                <Badge className="font-normal">Modifications non publiées</Badge>
              ) : latestVersion > 0 ? (
                <Badge variant="secondary" className="font-normal">
                  Aligné sur v{latestVersion}
                </Badge>
              ) : (
                <Badge variant="secondary" className="font-normal">
                  Brouillon à jour
                </Badge>
              )}
              {latestVersion > 0 ? (
                <Badge variant="outline" className="tabular-nums">
                  v{latestVersion} en prod
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal">
                  Aucune version publiée
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div
            className={cn(
              "grid gap-4",
              showPreview ? "lg:grid-cols-2 lg:gap-5" : "grid-cols-1",
            )}
          >
            <div className="flex min-h-0 flex-col space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={`md-${kind}`} className="text-sm font-medium">
                  Markdown
                </Label>
                <Button
                  type="button"
                  variant={showPreview ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview((p) => !p)}
                  className="shrink-0"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="mr-1.5 size-3.5" />
                      Masquer l&apos;aperçu
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 size-3.5" />
                      Aperçu rendu
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id={`md-${kind}`}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                spellCheck={false}
                rows={20}
                placeholder="Saisissez le prompt au format Markdown…"
                className="font-mono text-xs leading-relaxed md:min-h-[28rem] md:resize-y"
              />
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span>{charCount.toLocaleString("fr-FR")} caractères</span>
                <span className="text-muted-foreground/30 hidden sm:inline">·</span>
                <span>{lineCount.toLocaleString("fr-FR")} lignes</span>
              </div>
            </div>

            {showPreview && (
              <div className="flex min-h-0 flex-col space-y-2">
                <Label className="text-sm font-medium">Aperçu</Label>
                <div
                  className="prose prose-sm dark:prose-invert border-border/80 bg-card/50 max-h-[min(28rem,70vh)] min-h-[12rem] overflow-y-auto rounded-xl border p-4 text-sm shadow-inner"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/15 flex flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-xl text-xs leading-relaxed">
            La publication enregistre une version immuable et met à jour le prompt
            actif pour toutes les analyses {kind}.
          </p>
          <Button
            type="button"
            size="lg"
            disabled={pending || !canPublish}
            onClick={() => {
              setError(null);
              setPublishDialogOpen(true);
            }}
            title={
              !canPublish
                ? "Aucun changement par rapport au contenu chargé"
                : undefined
            }
          >
            <ArrowUpFromLine className="mr-2 size-4" />
            {pending ? "Publication…" : "Publier une nouvelle version"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Action impossible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
        <Card className="border-primary/15 shadow-sm ring-1 ring-primary/10">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  Comparaison v{diffVersion.version} → brouillon
                </CardTitle>
                <CardDescription>
                  Gauche : version historique sélectionnée. Droite : contenu actuel
                  de l&apos;éditeur.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setDiffVersion(null)}
              >
                <X className="mr-1.5 size-3.5" />
                Fermer le diff
              </Button>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-4 pt-1 text-[11px]">
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
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-4">
          <div className="overflow-hidden rounded-xl border bg-muted/20">
            <div className="bg-muted/50 text-muted-foreground grid grid-cols-2 divide-x border-b text-[10px] font-medium tracking-wide uppercase">
              <div className="flex min-h-9 items-center gap-2 px-3 py-2">
                <span className="text-foreground/90 shrink-0">v{diffVersion.version}</span>
                <span className="truncate font-normal normal-case">référence</span>
              </div>
              <div className="flex min-h-9 items-center gap-2 px-3 py-2">
                <span className="text-foreground/90 shrink-0">Brouillon</span>
                <span className="truncate font-normal normal-case">éditeur</span>
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
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-muted flex size-8 items-center justify-center rounded-lg">
              <History className="text-muted-foreground size-4" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-base">Historique des versions</CardTitle>
              <CardDescription>
                Jusqu&apos;à 30 dernières publications. Restaurer remplace le brouillon
                (sans publier automatiquement).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-4">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Aucune version enregistrée pour ce prompt.
            </p>
          ) : (
            <ul className="max-h-[min(32rem,55vh)] space-y-2 overflow-y-auto pr-1">
              {sorted.map((v) => {
                const isDiffTarget = diffVersion?.id === v.id;
                return (
                  <li
                    key={v.id}
                    className={cn(
                      "space-y-3 rounded-xl border p-4 text-xs transition-colors",
                      "hover:bg-muted/25",
                      isDiffTarget
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "bg-card border-border/80",
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="tabular-nums text-xs">
                          v{v.version}
                        </Badge>
                        <span className="text-foreground/90 max-w-[220px] truncate text-xs font-medium sm:max-w-xs">
                          {v.authorEmail ?? v.authorUserId}
                        </span>
                      </div>
                      <time
                        className="text-muted-foreground shrink-0 text-[11px] tabular-nums"
                        dateTime={v.createdAt}
                      >
                        {new Date(v.createdAt).toLocaleString("fr-FR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>

                    <p className="text-muted-foreground line-clamp-2 font-mono text-[11px] leading-relaxed">
                      {v.markdown.slice(0, 180)}
                      {v.markdown.length > 180 ? "…" : ""}
                    </p>

                    <Separator />

                    <div className="flex flex-col gap-2 sm:flex-row">
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
                        <RotateCcw className="mr-1.5 size-3.5" />
                        Restaurer dans l&apos;éditeur
                      </Button>
                      <Button
                        type="button"
                        variant={isDiffTarget ? "secondary" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          setDiffVersion((prev) => (prev?.id === v.id ? null : v))
                        }
                      >
                        <GitCompareArrows className="mr-1.5 size-3.5" />
                        {isDiffTarget ? "Masquer le diff" : "Comparer au brouillon"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
