import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  BarChart3,
  Monitor,
  Clock,
  Mail,
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

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      systemRoles: { select: { role: true } },
      organizationMemberships: {
        include: {
          organization: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { lastSeenAt: "desc" },
        take: 20,
      },
      meetingsAsSeller: {
        take: 10,
        orderBy: { meetingAt: "desc" },
        select: {
          id: true,
          prospectName: true,
          meetingAt: true,
          outcome: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    redirect("/admin/users");
  }

  const isSuperAdmin = user.systemRoles.some((r) => r.role === "SUPER_ADMIN");

  const [meetingCount, analysesCount, sessionCount] = await Promise.all([
    prisma.meeting.count({ where: { sellerUserId: id } }),
    prisma.meetingAnalysis.count({ where: { meeting: { sellerUserId: id } } }),
    prisma.session.count({ where: { userId: id } }),
  ]);

  const fullName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {fullName ?? user.email}
            </h1>
            <span
              className={
                user.status === "ACTIVE"
                  ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
              }
            >
              {user.status === "ACTIVE" ? "Actif" : "Bloqué"}
            </span>
            {user.profileRole && (
              <Badge variant="secondary" className="text-xs">
                {user.profileRole}
              </Badge>
            )}
            {isSuperAdmin && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                Super Admin
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3.5" />
              {user.email}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              Inscrit le {user.createdAt.toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Organisations" value={user.organizationMemberships.length} accent="violet" />
        <StatCard icon={CalendarDays} label="Rendez-vous" value={meetingCount} accent="emerald" />
        <StatCard icon={BarChart3} label="Analyses" value={analysesCount} accent="blue" />
        <StatCard icon={Monitor} label="Sessions" value={sessionCount} accent="amber" />
      </div>

      {/* Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-zinc-500" />
            Organisations
          </CardTitle>
          <CardDescription>
            {user.organizationMemberships.length} organisation(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Organisation</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Rôle</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Rejoint le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {user.organizationMemberships.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                        Aucune organisation.
                      </td>
                    </tr>
                  ) : (
                    user.organizationMemberships.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/admin/organizations/${m.organization.id}`}
                            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {m.organization.name}
                          </Link>
                          <p className="text-xs text-zinc-400">{m.organization.slug}</p>
                        </td>
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

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-4 text-zinc-500" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Sessions non expirées de l&apos;utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Dernière activité</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">User-Agent</th>
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Créée le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {user.sessions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                        Aucune session active.
                      </td>
                    </tr>
                  ) : (
                    user.sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {s.lastSeenAt.toLocaleDateString("fr-FR")}{" "}
                          {s.lastSeenAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="max-w-xs truncate px-4 py-2.5 text-zinc-500" title={s.userAgent ?? undefined}>
                          {s.userAgent
                            ? s.userAgent.length > 80
                              ? `${s.userAgent.slice(0, 80)}…`
                              : s.userAgent
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
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
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-zinc-500" />
            Derniers rendez-vous
          </CardTitle>
          <CardDescription>
            Les 10 derniers rendez-vous de l&apos;utilisateur
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
                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-400">Organisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {user.meetingsAsSeller.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                        Aucun rendez-vous.
                      </td>
                    </tr>
                  ) : (
                    user.meetingsAsSeller.map((m) => {
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
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/admin/organizations/${m.organization.id}`}
                              className="text-zinc-700 hover:underline dark:text-zinc-300"
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
