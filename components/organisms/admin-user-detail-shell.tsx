import Link from "next/link";
import {
  Building2,
  CalendarDays,
  BarChart3,
  Monitor,
  Clock,
  Mail,
} from "lucide-react";
import { MeetingOutcomeBadge } from "@/components/atoms/meeting-outcome-badge";
import { cardTitleClass } from "@/lib/page-typography";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { PageDetailHeader } from "@/components/molecules/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AdminUserDetail } from "@/src/core/ports/backoffice-repository-port";

type AdminUserDetailShellProps = { user: AdminUserDetail };

export function AdminUserDetailShell({ user }: AdminUserDetailShellProps) {
  const isSuperAdmin = user.isSuperAdmin;
  const meetingCount = user.meetingCount;
  const analysesCount = user.analysesCount;
  const sessionCount = user.sessionCount;
  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : null;

  return (
    <div className="space-y-6">
      <PageDetailHeader
        backHref="/admin/users"
        title={fullName ?? user.email}
        badges={
          <>
            <span
              className={
                user.status === "ACTIVE"
                  ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
              }
            >
              {user.status === "ACTIVE" ? "Actif" : "Bloqué"}
            </span>
            {user.profileRole ? (
              <Badge variant="secondary" className="text-xs">
                {user.profileRole}
              </Badge>
            ) : null}
            {isSuperAdmin ? (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Super Admin
              </Badge>
            ) : null}
          </>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3.5" />
              {user.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              Inscrit le {user.createdAt.toLocaleDateString("fr-FR")}
            </span>
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={Building2}
          label="Organisations"
          value={user.organizationMemberships.length}
          accent="violet"
        />
        <AdminKpiCard
          icon={CalendarDays}
          label="Rendez-vous"
          value={meetingCount}
          accent="emerald"
        />
        <AdminKpiCard
          icon={BarChart3}
          label="Analyses"
          value={analysesCount}
          accent="blue"
        />
        <AdminKpiCard
          icon={Monitor}
          label="Sessions"
          value={sessionCount}
          accent="amber"
        />
      </div>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
            <Building2 className="size-4 text-muted-foreground" />
            Organisations
          </CardTitle>
          <CardDescription>
            {user.organizationMemberships.length} organisation(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Organisation
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
                  {user.organizationMemberships.length === 0 ? (
                    <TableEmptyRow colSpan={3} message="Aucune organisation." />
                  ) : (
                    user.organizationMemberships.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-muted/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/admin/organizations/${m.organization.id}`}
                            className="font-medium text-foreground hover:underline dark:text-zinc-100"
                          >
                            {m.organization.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {m.organization.slug}
                          </p>
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

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
            <Monitor className="size-4 text-muted-foreground" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Sessions non expirées de l&apos;utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-border dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Dernière activité
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      User-Agent
                    </th>
                    <th className="px-4 py-2.5 font-medium text-muted-foreground dark:text-zinc-400">
                      Créée le
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-800">
                  {user.sessions.length === 0 ? (
                    <TableEmptyRow
                      colSpan={3}
                      message="Aucune session active."
                    />
                  ) : (
                    user.sessions.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-muted/60 dark:hover:bg-zinc-800/40"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-foreground dark:text-zinc-300">
                          {s.lastSeenAt.toLocaleDateString("fr-FR")}{" "}
                          {s.lastSeenAt.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td
                          className="max-w-xs truncate px-4 py-2.5 text-muted-foreground"
                          title={s.userAgent ?? undefined}
                        >
                          {/* Un tiret ne dit pas si le navigateur n'a rien
                              envoyé ou si la donnée s'est perdue. */}
                          {s.userAgent ? (
                            s.userAgent.length > 80 ? (
                              `${s.userAgent.slice(0, 80)}…`
                            ) : (
                              s.userAgent
                            )
                          ) : (
                            <span
                              className="italic"
                              title="Le navigateur n'a pas transmis son identification lors de cette session."
                            >
                              Non transmis
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                          {s.createdAt.toLocaleDateString("fr-FR")}
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
            Les 10 derniers rendez-vous de l&apos;utilisateur
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
                      Organisation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-zinc-800">
                  {user.meetingsAsSeller.length === 0 ? (
                    <TableEmptyRow colSpan={4} message="Aucun rendez-vous." />
                  ) : (
                    user.meetingsAsSeller.map((m) => {
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
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/admin/organizations/${m.organization.id}`}
                              className="text-foreground hover:underline dark:text-zinc-300"
                            >
                              {m.organization.name}
                            </Link>
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
    </div>
  );
}
