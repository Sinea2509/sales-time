"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { updateFeedbackStatusAction } from "@/app/[locale]/admin/feedbacks/actions";
import { buildFeedbackCursorMarkdown } from "@/src/core/domain/feedback-cursor-export";
import { formatFeedbackUserRoleLabel } from "@/src/core/domain/feedback-submit-context";
import { parseFeedbackExtra } from "@/src/core/domain/feedback-target-element";
import { blobProxyUrl } from "@/lib/blob-paths";
import {
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/lib/feedback-list-filters";
import type { FeedbackRow } from "@/src/core/ports/feedback-repository-port";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { cn } from "@/lib/utils";

function priorityBadgeClass(priority: FeedbackRow["priority"]): string {
  switch (priority) {
    case "CRITICAL":
      return "border-red-300 bg-red-50 text-red-800";
    case "HIGH":
      return "border-orange-300 bg-orange-50 text-orange-800";
    case "MEDIUM":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "LOW":
      return "border-border bg-muted text-foreground";
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
        onClick={() => setOpen((value) => !value)}
      >
        {title}
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t px-3 py-2 text-xs">{children}</div>
      ) : null}
    </div>
  );
}

function ScreenshotLightbox({
  row,
  open,
  onOpenChange,
}: {
  row: FeedbackRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const extra = parseFeedbackExtra(row.extra);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Capture · {row.type}</DialogTitle>
        </DialogHeader>
        {row.screenshotUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobProxyUrl(row.screenshotUrl)}
              alt="Screenshot"
              className="max-h-[70vh] w-full rounded border object-contain"
            />
          </div>
        ) : null}
        {extra.elementCropUrl ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Crop élément</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blobProxyUrl(extra.elementCropUrl)}
              alt="Element crop"
              className="max-h-48 rounded border object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AdminFeedbacksInbox({ rows }: { rows: FeedbackRow[] }) {
  const [, startTransition] = useTransition();
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const roleLabel = formatFeedbackUserRoleLabel(row.extra);
        const extra = parseFeedbackExtra(row.extra);
        const target = extra.targetElement;
        const adminNotes = notesDraft[row.id] ?? row.adminNotes ?? "";

        return (
          <article
            key={row.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                      priorityBadgeClass(row.priority),
                    )}
                  >
                    {FEEDBACK_PRIORITY_LABELS[row.priority]}
                  </span>
                  <span className="bg-muted inline-flex rounded-full px-2 py-0.5 text-xs font-medium">
                    {FEEDBACK_TYPE_LABELS[row.type]}
                  </span>
                  <p className="font-semibold">{row.userEmail ?? "Anonyme"}</p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {row.createdAt.toLocaleString("fr-FR")}
                  {row.companyName ? ` · ${row.companyName}` : ""}
                  {roleLabel ? ` · ${roleLabel}` : ""}
                </p>
              </div>
              <select
                className={nativeSelectClassName}
                defaultValue={row.status}
                onChange={(e) =>
                  startTransition(async () => {
                    await updateFeedbackStatusAction({
                      id: row.id,
                      status: e.target.value as FeedbackRow["status"],
                      adminNotes: adminNotes || null,
                    });
                  })
                }
              >
                <option value="NEW">Nouveau</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="RESOLVED">Résolu</option>
                <option value="WONT_FIX">Won&apos;t fix</option>
              </select>
            </div>

            <p className="mt-3 text-sm whitespace-pre-wrap">{row.message}</p>

            {target ? (
              <div className="bg-muted/40 mt-3 rounded-lg border p-3 text-xs">
                <p className="font-medium">Élément ciblé</p>
                <p className="mt-1">
                  {target.tagName}
                  {target.dataFeedbackId ? ` · ${target.dataFeedbackId}` : ""}
                </p>
                {target.textSnippet ? (
                  <p className="mt-1 truncate">
                    &quot;{target.textSnippet}&quot;
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <code className="truncate font-mono">
                    {target.cssSelector}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 shrink-0 px-2"
                    onClick={() =>
                      void navigator.clipboard.writeText(target.cssSelector)
                    }
                  >
                    Copier
                  </Button>
                </div>
              </div>
            ) : null}

            {row.screenshotUrl ? (
              <button
                type="button"
                className="mt-3 block"
                onClick={() => setLightboxId(row.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blobProxyUrl(row.screenshotUrl)}
                  alt="Screenshot"
                  className="max-h-48 rounded border object-contain"
                />
              </button>
            ) : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <CollapsibleSection title="Erreurs console">
                {Array.isArray(row.consoleErrors) &&
                (row.consoleErrors as string[]).length > 0 ? (
                  <ul className="space-y-1">
                    {(row.consoleErrors as string[]).map((entry) => (
                      <li key={entry} className="break-all">
                        {entry}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Aucune</p>
                )}
              </CollapsibleSection>
              <CollapsibleSection title="Réseau / avertissements">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Réseau</p>
                    {(extra.networkErrors ?? []).length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {(extra.networkErrors ?? []).map((entry) => (
                          <li key={entry} className="break-all">
                            {entry}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Aucune</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Avertissements</p>
                    {(extra.consoleWarnings ?? []).length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {(extra.consoleWarnings ?? []).map((entry) => (
                          <li key={entry} className="break-all">
                            {entry}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">Aucun</p>
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            <div className="mt-3 space-y-2">
              <Label htmlFor={`notes-${row.id}`}>Notes admin</Label>
              <Textarea
                id={`notes-${row.id}`}
                rows={2}
                value={adminNotes}
                onChange={(event) =>
                  setNotesDraft((current) => ({
                    ...current,
                    [row.id]: event.target.value,
                  }))
                }
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  startTransition(async () => {
                    await updateFeedbackStatusAction({
                      id: row.id,
                      status: row.status,
                      adminNotes: adminNotes || null,
                    });
                  })
                }
              >
                Enregistrer les notes
              </Button>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  void navigator.clipboard.writeText(
                    buildFeedbackCursorMarkdown(row),
                  )
                }
              >
                <Copy className="mr-1 size-3.5" />
                Copier pour Cursor
              </Button>
            </div>

            <ScreenshotLightbox
              row={row}
              open={lightboxId === row.id}
              onOpenChange={(open) => setLightboxId(open ? row.id : null)}
            />
          </article>
        );
      })}
    </div>
  );
}
