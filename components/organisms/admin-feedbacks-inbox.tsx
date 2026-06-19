"use client";

import { useTransition } from "react";
import { Copy } from "lucide-react";
import { updateFeedbackStatusAction } from "@/app/[locale]/admin/feedbacks/actions";
import { buildFeedbackCursorMarkdown } from "@/src/core/domain/feedback-cursor-export";
import { orgBlobProxyUrl } from "@/lib/blob-paths";
import type { FeedbackRow } from "@/src/core/ports/feedback-repository-port";
import { Button } from "@/components/ui/button";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

export function AdminFeedbacksInbox({ rows }: { rows: FeedbackRow[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">
                {row.type} — {row.userEmail ?? "Anonyme"}
              </p>
              <p className="text-muted-foreground text-xs">
                {row.createdAt.toLocaleString("fr-FR")}
                {row.companyName ? ` · ${row.companyName}` : ""}
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
          {row.screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgBlobProxyUrl(row.screenshotUrl)}
              alt="Screenshot"
              className="mt-3 max-h-48 rounded border object-contain"
            />
          ) : null}
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
        </article>
      ))}
    </div>
  );
}
