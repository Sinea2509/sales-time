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
import { AdminExportButton } from "@/components/molecules/admin-export-button";

type AuditRow = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorName: string | null;
  organizationId: string;
  action: string;
  reason: string | null;
  createdAt: string;
};

type Props = {
  logs: AuditRow[];
};

const ACTION_OPTIONS = [
  "Tous",
  "ENTER_ORGANIZATION",
  "EXIT_ORGANIZATION",
  "PUBLISH_PROMPT",
  "RESTORE_PROMPT",
  "CREATE_ORGANIZATION",
  "UPDATE_ORGANIZATION",
  "DELETE_ORGANIZATION",
  "BLOCK_USER",
  "UNBLOCK_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "INVITE_USER_TO_ORG",
] as const;

type ActionType = (typeof ACTION_OPTIONS)[number];

const ACTION_LABELS: Record<string, string> = {
  ENTER_ORGANIZATION: "Entrer dans org",
  EXIT_ORGANIZATION: "Quitter org",
  PUBLISH_PROMPT: "Publier prompt",
  RESTORE_PROMPT: "Restaurer prompt",
  CREATE_ORGANIZATION: "Créer org",
  UPDATE_ORGANIZATION: "Modifier org",
  DELETE_ORGANIZATION: "Supprimer org",
  BLOCK_USER: "Bloquer utilisateur",
  UNBLOCK_USER: "Débloquer utilisateur",
  UPDATE_USER: "Modifier utilisateur",
  DELETE_USER: "Supprimer utilisateur",
  INVITE_USER_TO_ORG: "Inviter dans org",
};

function actionBadgeClasses(action: string): string {
  if (action.startsWith("DELETE_") || action === "BLOCK_USER") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300";
  }
  if (
    action.startsWith("CREATE_") ||
    action.startsWith("UPDATE_") ||
    action === "UNBLOCK_USER" ||
    action === "INVITE_USER_TO_ORG"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300";
  }
  if (action === "ENTER_ORGANIZATION" || action === "EXIT_ORGANIZATION") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
  }
  if (action === "PUBLISH_PROMPT" || action === "RESTORE_PROMPT") {
    return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300";
}

export function AdminAuditLog({ logs }: Props) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionType>("Tous");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "Tous" && log.action !== actionFilter) return false;
      if (!q) return true;
      return (
        log.actorEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.reason?.toLowerCase() ?? "").includes(q) ||
        log.organizationId.toLowerCase().includes(q)
      );
    });
  }, [logs, search, actionFilter]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher par e-mail, action, raison ou ID org..."
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
                {opt === "Tous" ? "Tous les types" : (ACTION_LABELS[opt] ?? opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  Date / Heure
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  Acteur
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  Action
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 md:table-cell dark:text-zinc-400">
                  Organisation
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 lg:table-cell dark:text-zinc-400">
                  Raison
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-16 text-center text-zinc-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ScrollText className="size-8 text-zinc-300 dark:text-zinc-600" />
                      <p>Aucune entrée trouvée.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500">
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
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {log.actorEmail}
                        </p>
                        {log.actorName && (
                          <p className="truncate text-xs text-zinc-400">
                            {log.actorName}
                          </p>
                        )}
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
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <span className="font-mono text-xs text-zinc-500">
                        {log.organizationId}
                      </span>
                    </td>
                    <td className="hidden max-w-[260px] px-4 py-3.5 lg:table-cell">
                      {log.reason ? (
                        <span className="truncate text-zinc-600 dark:text-zinc-300">
                          {log.reason}
                        </span>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">
            {filtered.length} entrée(s) sur {logs.length}
          </p>
        </div>
      </div>
    </>
  );
}
