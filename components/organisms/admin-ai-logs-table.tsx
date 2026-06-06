"use client";

import { useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { replayAiLogAction } from "@/app/[locale]/admin/ai-logs/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AiRequestLogRow } from "@/src/core/ports/ai-request-log-repository-port";

export function AdminAiLogsTable({ rows }: { rows: AiRequestLogRow[] }) {
  const [selected, setSelected] = useState<AiRequestLogRow | null>(null);
  const [replayResult, setReplayResult] = useState<string | null>(null);

  async function handleReplay(id: string) {
    setReplayResult("Rejeu en cours…");
    const res = await replayAiLogAction(id);
    setReplayResult(res.ok ? "Rejeu terminé." : `Erreur : ${res.error}`);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Modèle</th>
              <th className="px-3 py-2">Tokens</th>
              <th className="px-3 py-2">Latence</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.createdAt.toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2">{row.kind}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      row.status === "SUCCESS"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2">{row.modelName}</td>
                <td className="px-3 py-2 tabular-nums">
                  {(row.inputTokens ?? 0) + (row.outputTokens ?? 0)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {row.latencyMs != null ? `${row.latencyMs} ms` : "—"}
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplayResult(null);
                      setSelected(row);
                    }}
                  >
                    Inspecter
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={selected != null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appel IA — {selected?.kind}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void handleReplay(selected.id)}
                >
                  <RotateCcw className="mr-1 size-3.5" />
                  Replay
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void navigator.clipboard.writeText(
                      JSON.stringify(selected.rawOutput ?? {}, null, 2),
                    )
                  }
                >
                  <Copy className="mr-1 size-3.5" />
                  Copier output
                </Button>
              </div>
              {replayResult ? (
                <p className="text-muted-foreground text-xs">{replayResult}</p>
              ) : null}
              <div>
                <p className="font-medium">System prompt</p>
                <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
                  {selected.systemPrompt ?? "—"}
                </pre>
              </div>
              <div>
                <p className="font-medium">User prompt</p>
                <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
                  {selected.userPrompt ?? "—"}
                </pre>
              </div>
              <div>
                <p className="font-medium">Output</p>
                <pre className="mt-1 max-h-60 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selected.rawOutput ?? {}, null, 2)}
                </pre>
              </div>
              {selected.errorMessage ? (
                <p className="text-destructive text-xs">{selected.errorMessage}</p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
