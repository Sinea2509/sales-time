import Link from "next/link";
import {
  Users,
  CalendarDays,
  BarChart3,
  Mail,
  Globe,
  Shield,
  Clock,
} from "lucide-react";
import { meetingOutcomeConfig } from "@/lib/meeting-outcome-config";
import { cardTitleClass } from "@/lib/page-typography";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { PageDetailHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type {
  AdminOrganizationDetail,
  AdminOrgAuditLogRow,
} from "@/src/core/ports/backoffice-repository-port";

type AdminOrganizationDetailShellProps = {
  org: AdminOrganizationDetail;
  analysesCount: number;
  auditLogs: AdminOrgAuditLogRow[];
};

export function AdminOrganizationDetailShell({
  org,
  analysesCount,
  auditLogs,
}: AdminOrganizationDetailShellProps) {
  return (
    <div className="space-y-6">
      <PageDetailHeader
        backHref="/admin/organizations"
        title={org.name}
        badges={
          <Badge variant="secondary" className="font-mono text-xs">
            {org.slug}
          </Badge>
        }
        meta={
          <>
            {org.websiteNormalized ? (
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3.5" />
                {org.websiteNormalized}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              Créée le {org.createdAt.toLocaleDateString("fr-FR")}
            </span>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={Users}
          label="Membres"
          value={org.counts.memberships}
          accent="blue"
        />
        <AdminKpiCard
          icon={CalendarDays}
          label="Rendez-vous"
          value={org.counts.meetings}
          accent="emerald"
        />
        <AdminKpiCard
          icon={BarChart3}
          label="Analyses"
          value={analysesCount}
          accent="violet"
        />
        <AdminKpiCard
          icon={Mail}
          label="Invitations"
          value={org.counts.invitations}
          accent="amber"
        />
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-zinc-500" />
            Membres
          </CardTitle>
          <CardDescription>
            {org.memberships.length} membre(s) dans l&apos;organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Utilisateur
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      E-mail
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Rôle
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Rejoint le
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {org.memberships.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun membre." />
                  ) : (
                    org.memberships.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                          <Link
                            href={`/admin/users/${m.userId}`}
                            className="hover:underline"
                          >
                            {m.user.firstName && m.user.lastName
                              ? `${m.user.firstName} ${m.user.lastName}`
                              : m.user.email}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500">
                          {m.user.email}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              m.role === "ADMIN" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {organizationMembershipRoleLabel(m.role)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                          {m.createdAt.toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
            <CalendarDays className="size-4 text-zinc-500" />
            Derniers rendez-vous
          </CardTitle>
          <CardDescription>
            Les 10 derniers rendez-vous de l&apos;organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Prospect
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Résultat
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Vendeur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {org.meetings.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun rendez-vous." />
                  ) : (
                    org.meetings.map((m) => {
                      const oc =
                        meetingOutcomeConfig[m.outcome] ??
                        meetingOutcomeConfig.OTHER;
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                        >
                          <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                            {m.prospectName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                            {m.meetingAt.toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className={oc.className}>
                              {oc.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-500">
                            {m.seller.firstName && m.seller.lastName
                              ? `${m.seller.firstName} ${m.seller.lastName}`
                              : m.seller.email}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
            <Shield className="size-4 text-zinc-500" />
            Journal d&apos;audit
          </CardTitle>
          <CardDescription>
            Actions des super-administrateurs sur cette organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Acteur
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Action
                    </th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Raison
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {auditLogs.length === 0 ? (
                    <TableEmptyRow
                      colSpan={4}
                      message="Aucune entrée d'audit."
                    />
                  ) : (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                          {log.createdAt.toLocaleDateString("fr-FR")}{" "}
                          {log.createdAt.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {log.actor.email}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 text-zinc-500">
                          {log.reason ?? "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
