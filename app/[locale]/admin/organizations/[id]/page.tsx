import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CalendarDays,
  BarChart3,
  Mail,
  Globe,
  Shield,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

const outcomeConfig: Record<string, { label: string; className: string }> = {
  WON: {
    label: "Gagné",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  LOST: {
    label: "Perdu",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  FOLLOW_UP: {
    label: "Suivi",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  NO_SHOW: {
    label: "Absent",
    className:
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
  OTHER: {
    label: "Autre",
    className:
      "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
};

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      meetings: {
        take: 10,
        orderBy: { meetingAt: "desc" },
        select: {
          id: true,
          prospectName: true,
          meetingAt: true,
          outcome: true,
          sellerUserId: true,
          seller: { select: { email: true, firstName: true, lastName: true } },
        },
      },
      invitations: { select: { id: true } },
      _count: {
        select: {
          memberships: true,
          meetings: true,
          invitations: true,
        },
      },
    },
  });

  if (!org) {
    redirect("/admin/organizations");
  }

  const analysesCount = await prisma.meetingAnalysis.count({
    where: { meeting: { organizationId: id } },
  });

  const auditLogs = await prisma.superAdminAuditLog.findMany({
    where: { organizationId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      actor: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/organizations"
          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {org.slug}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            {org.websiteNormalized && (
              <span className="inline-flex items-center gap-1">
                <Globe className="size-3.5" />
                {org.websiteNormalized}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              Créée le {org.createdAt.toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Membres" value={org._count.memberships} accent="blue" />
        <StatCard icon={CalendarDays} label="Rendez-vous" value={org._count.meetings} accent="emerald" />
        <StatCard icon={BarChart3} label="Analyses" value={analysesCount} accent="violet" />
        <StatCard icon={Mail} label="Invitations" value={org._count.invitations} accent="amber" />
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
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Utilisateur</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">E-mail</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Rôle</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Rejoint le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {org.memberships.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                        Aucun membre.
                      </td>
                    </tr>
                  ) : (
                    org.memberships.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
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
                        <td className="px-4 py-2.5 text-zinc-500">{m.user.email}</td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={m.role === "ADMIN" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {m.role === "ADMIN" ? "Admin" : "Membre"}
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
          <CardTitle className="flex items-center gap-2">
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
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Prospect</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Résultat</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Vendeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {org.meetings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                        Aucun rendez-vous.
                      </td>
                    </tr>
                  ) : (
                    org.meetings.map((m) => {
                      const oc = outcomeConfig[m.outcome] ?? outcomeConfig.OTHER;
                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
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
          <CardTitle className="flex items-center gap-2">
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
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Date</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Acteur</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Action</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Raison</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                        Aucune entrée d&apos;audit.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                          {log.createdAt.toLocaleDateString("fr-FR")}{" "}
                          {log.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: "blue" | "emerald" | "violet" | "amber";
}) {
  const accentMap = {
    blue: { bg: "bg-blue-50 dark:bg-blue-950/40", icon: "text-blue-600 dark:text-blue-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400" },
    violet: { bg: "bg-violet-50 dark:bg-violet-950/40", icon: "text-violet-600 dark:text-violet-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-600 dark:text-amber-400" },
  };
  const colors = accentMap[accent];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`flex size-10 items-center justify-center rounded-lg ${colors.bg}`}>
        <Icon className={`size-5 ${colors.icon}`} />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {value.toLocaleString("fr-FR")}
        </p>
        <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      </div>
    </div>
  );
}
