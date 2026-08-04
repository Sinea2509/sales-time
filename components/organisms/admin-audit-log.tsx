"use client";

import { useMemo, useState } from "react";
import { Search, ScrollText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { AdminExportButton } from "@/components/molecules/admin-export-button";
import {
  PLATFORM_AUDIT_ACTIONS,
  PLATFORM_AUDIT_ACTION_LABELS,
  resolveAuditOrganizationLabel,
} from "@/src/core/domain/platform-audit-actions";

type AuditRow = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorName: string | null;
  organizationId: string;
  organizationName: string | null;
  action: string;
  reason: string | null;
  createdAt: string;
};

type Props = {
  logs: AuditRow[];
};

const ACTION_OPTIONS = ["Tous", ...PLATFORM_AUDIT_ACTIONS] as const;

type ActionType = (typeof ACTION_OPTIONS)[number];

function actionBadgeClasses(action: string): string {
  if (action.startsWith("DELETE_") || action === "BLOCK_USER") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (
    action.startsWith("CREATE_") ||
    action.startsWith("UPDATE_") ||
    action.startsWith("ORG_") ||
    action.startsWith("USER_") ||
    action === "UNBLOCK_USER" ||
    action === "INVITE_USER_TO_ORG" ||
    action === "INVITE_SUPER_ADMIN"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
  }
  if (
    action === "ENTER_ORGANIZATION" ||
    action === "EXIT_ORGANIZATION" ||
    action === "ENTER_ORG" ||
    action === "EXIT_ORG"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  if (
    action === "PUBLISH_PROMPT" ||
    action === "RESTORE_PROMPT" ||
    action === "UPDATE_PROMPT_MODEL" ||
    action === "PUBLISH_KISS_QUADRANT_PROMPTS" ||
    action === "REPLAY_AI_LOG"
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300";
  }
  return "border-border bg-muted text-foreground dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300";
}

export function AdminAuditLog({ logs }: Props) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionType>("Tous");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "Tous" && log.action !== actionFilter) return false;
      if (!q) return true;
      const orgLabel = resolveAuditOrganizationLabel(
        log.organizationId,
        log.organizationName,
      );
      return (
        log.actorEmail.toLowerCase().includes(q) ||
        (log.actorName?.toLowerCase().includes(q) ?? false) ||
        log.action.toLowerCase().includes(q) ||
        (log.reason?.toLowerCase().includes(q) ?? false) ||
        log.organizationId.toLowerCase().includes(q) ||
        orgLabel.toLowerCase().includes(q)
      );
    });
  }, [logs, search, actionFilter]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par acteur, org, action ou raison..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <AdminExportButton
          data={filtered}
          filename="journal-audit"
          columns={[
            { key: "createdAt", label: "Date" },
            { key: "actorEmail", label: "Acteur" },
            { key: "actorName", label: "Nom acteur" },
            { key: "action", label: "Action" },
            { key: "organizationId", label: "Organisation ID" },
            { key: "organizationName", label: "Organisation" },
            { key: "reason", label: "Raison" },
          ]}
        />
        <Select
          value={actionFilter}
          onValueChange={(v: string | null) => {
            if (v) setActionFilter(v as ActionType);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === "Tous"
                  ? "Tous les types"
                  : (PLATFORM_AUDIT_ACTION_LABELS[opt] ?? opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                <th className="px-4 py-3 font-medium text-muted-foreground dark:text-zinc-400">
                  Date / Heure
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground dark:text-zinc-400">
                  Acteur
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground dark:text-zinc-400">
                  Action
                </th>
                <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell dark:text-zinc-400">
                  Organisation
                </th>
                <th className="hidden px-4 py-3 font-medium text-muted-foreground lg:table-cell dark:text-zinc-400">
                  Raison
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  message="Aucune entrée trouvée."
                  size="hero"
                  icon={ScrollText}
                />
              ) : (
                filtered.map((log) => {
                  const orgLabel = resolveAuditOrganizationLabel(
                    log.organizationId,
                    log.organizationName,
                  );
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-muted/60 dark:hover:bg-zinc-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground dark:text-zinc-100">
                            {log.actorEmail}
                          </p>
                          {log.actorName ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {log.actorName}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium",
                            actionBadgeClasses(log.action),
                          )}
                        >
                          {PLATFORM_AUDIT_ACTION_LABELS[log.action] ??
                            log.action}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3.5 md:table-cell">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground dark:text-zinc-200">
                            {orgLabel}
                          </p>
                          {orgLabel !== log.organizationId ? (
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {log.organizationId}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="hidden max-w-[260px] px-4 py-3.5 lg:table-cell">
                        {log.reason ? (
                          <span className="truncate text-muted-foreground dark:text-zinc-300">
                            {log.reason}
                          </span>
                        ) : (
                          <span className="text-muted-foreground dark:text-zinc-400">
                            Sans motif
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 dark:border-zinc-800">
          <p className="text-xs text-muted-foreground">
            {filtered.length} entrée(s) sur {logs.length}
          </p>
        </div>
      </div>
    </>
  );
}
