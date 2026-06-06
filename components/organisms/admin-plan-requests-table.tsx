"use client";

import { useTransition } from "react";
import { updatePlanRequestStatusAction } from "@/app/[locale]/company/plan-actions";
import type { PlanRequestRow } from "@/src/core/ports/plan-request-repository-port";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

export function AdminPlanRequestsTable({ rows }: { rows: PlanRequestRow[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Organisation</th>
            <th className="px-3 py-2">Demandeur</th>
            <th className="px-3 py-2">Plan</th>
            <th className="px-3 py-2">Message</th>
            <th className="px-3 py-2">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 whitespace-nowrap">
                {row.createdAt.toLocaleString("fr-FR")}
              </td>
              <td className="px-3 py-2">{row.organizationName}</td>
              <td className="px-3 py-2">{row.requesterEmail ?? "—"}</td>
              <td className="px-3 py-2">{row.desiredPlan ?? "—"}</td>
              <td className="px-3 py-2 max-w-xs truncate">{row.message ?? "—"}</td>
              <td className="px-3 py-2">
                <select
                  className={nativeSelectClassName}
                  defaultValue={row.status}
                  onChange={(e) =>
                    startTransition(async () => {
                      await updatePlanRequestStatusAction({
                        id: row.id,
                        status: e.target
                          .value as PlanRequestRow["status"],
                      });
                    })
                  }
                >
                  <option value="NEW">Nouveau</option>
                  <option value="CONTACTED">Contacté</option>
                  <option value="CONVERTED">Converti</option>
                  <option value="DISMISSED">Ignoré</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
