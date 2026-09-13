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
import { MeetingOutcomeBadge } from "@/components/atoms/meeting-outcome-badge";
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
            <Users className="size-4 text-muted-foreground" />
            Membres
          </CardTitle>
          <CardDescription>
            {org.memberships.length} membre(s) dans l&apos;organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Utilisateur
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      E-mail
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Rôle
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Rejoint le
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-800">
                  {org.memberships.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun membre." />
                  ) : (
                    org.memberships.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-muted/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="px-4 py-2.5 font-medium text-foreground dark:text-zinc-100">
                          <Link
                            href={`/admin/users/${m.userId}`}
                            className="hover:underline"
                          >
                            {m.user.firstName && m.user.lastName
                              ? `${m.user.firstName} ${m.user.lastName}`
                              : m.user.email}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
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
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
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
            <CalendarDays className="size-4 text-muted-foreground" />
            Derniers rendez-vous
          </CardTitle>
          <CardDescription>
            Les 10 derniers rendez-vous de l&apos;organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Prospect
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Date
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Résultat
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Vendeur
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-800">
                  {org.meetings.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun rendez-vous." />
                  ) : (
                    org.meetings.map((m) => {
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-muted/60 dark:hover:bg-zinc-800/40"
                        >
                          <td className="px-4 py-2.5 font-medium text-foreground dark:text-zinc-100">
                            {m.prospectName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                            {m.meetingAt.toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-2.5">
                            <MeetingOutcomeBadge outcome={m.outcome} />
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
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
            <Shield className="size-4 text-muted-foreground" />
            Journal d&apos;audit
          </CardTitle>
          <CardDescription>
            Actions des super-administrateurs sur cette organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Date
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Acteur
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Action
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Raison
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-800">
                  {auditLogs.length === 0 ? (
                    <TableEmptyRow
                      colSpan={4}
                      message="Aucune entrée d'audit."
                    />
                  ) : (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-muted/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                          {log.createdAt.toLocaleDateString("fr-FR")}{" "}
                          {log.createdAt.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-foreground dark:text-zinc-300">
                          {log.actor.email}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 text-muted-foreground">
                          {/* La raison est facultative à la saisie : le dire
                              vaut mieux que laisser une case muette. */}
                          {log.reason ?? (
                            <span
                              className="italic"
                              title="L'auteur de l'action n'a pas indiqué de raison."
                            >
                              Non renseignée
                            </span>
                          )}
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
