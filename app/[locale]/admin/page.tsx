import {
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react";
import { getApplicationDeps } from "@/lib/application-deps";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { AdminActivityChart } from "@/components/organisms/admin-activity-chart";
import { AdminOrgGrowthChart } from "@/components/organisms/admin-org-growth-chart";
import { AdminDateRangePicker } from "@/components/molecules/admin-date-range-picker";

export const dynamic = "force-dynamic";

const VALID_RANGES: Record<string, number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

export default async function AdminDashboardPage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await props.searchParams;
  const rangeDays = VALID_RANGES[rawRange ?? ""] ?? 30;
  const now = new Date();
  const deps = getApplicationDeps();
  const {
    totalUsers,
    totalOrgs,
    totalMeetings,
    totalAnalyses,
    dau,
    wau,
    mau,
    prevWau,
    prevMau,
    meetings30d,
    prevMeetings30d,
    analyses30d,
    activeOrgs30d,
    newUsersThisMonth,
    newOrgsThisMonth,
    recentUsers,
    recentOrgs,
    dailyActiveData,
    orgGrowthData,
  } = await deps.backoffice.getAdminDashboardBundle({ rangeDays, now });

  function trendPercent(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
  }

  const wauTrend = trendPercent(wau, prevWau);
  const mauTrend = trendPercent(mau, prevMau);
  const meetingsTrend = trendPercent(meetings30d, prevMeetings30d);

  const avgMeetingsPerOrg =
    totalOrgs > 0 ? Math.round(totalMeetings / totalOrgs) : 0;
  const avgAnalysesPerMeeting =
    totalMeetings > 0 ? (totalAnalyses / totalMeetings).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard plateforme</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Vue d&apos;ensemble de l&apos;activité et des KPIs SaaS de Sales Time.
          </p>
        </div>
        <AdminDateRangePicker />
      </div>

      {/* Hero KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={Users}
          label="Utilisateurs totaux"
          value={totalUsers}
          footer={`+${newUsersThisMonth} ce mois`}
          accent="blue"
        />
        <AdminKpiCard
          icon={Building2}
          label="Organisations"
          value={totalOrgs}
          footer={`+${newOrgsThisMonth} ce mois`}
          accent="violet"
        />
        <AdminKpiCard
          icon={CalendarDays}
          label="Rendez-vous totaux"
          value={totalMeetings}
          footer={`${avgMeetingsPerOrg} moy. / org`}
          accent="emerald"
        />
        <AdminKpiCard
          icon={BarChart3}
          label="Analyses totales"
          value={totalAnalyses}
          footer={`${avgAnalysesPerMeeting} moy. / RDV`}
          accent="amber"
        />
      </div>

      {/* Engagement Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={Activity}
          label="DAU"
          value={dau}
          footer="Utilisateurs actifs (24h)"
          accent="blue"
        />
        <AdminKpiCard
          icon={TrendingUp}
          label="WAU"
          value={wau}
          trend={wauTrend}
          footer="Utilisateurs actifs (7j)"
          accent="emerald"
        />
        <AdminKpiCard
          icon={TrendingUp}
          label="MAU"
          value={mau}
          trend={mauTrend}
          footer={`Utilisateurs actifs (${rangeDays}j)`}
          accent="violet"
        />
        <AdminKpiCard
          icon={Zap}
          label={`Orgs actives (${rangeDays}j)`}
          value={activeOrgs30d}
          footer="Au moins 1 RDV créé"
          accent="amber"
        />
      </div>

      {/* Activity Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminKpiCard
          icon={CalendarDays}
          label={`RDV (${rangeDays} jours)`}
          value={meetings30d}
          trend={meetingsTrend}
          footer={`vs. ${rangeDays} jours précédents`}
          accent="emerald"
        />
        <AdminKpiCard
          icon={BarChart3}
          label={`Analyses (${rangeDays} jours)`}
          value={analyses30d}
          footer="Sur la période glissante"
          accent="blue"
        />
        <AdminKpiCard
          icon={TrendingDown}
          label="Stickiness (DAU/MAU)"
          value={mau > 0 ? `${Math.round((dau / mau) * 100)}%` : "—"}
          footer={"Ratio d'engagement quotidien"}
          accent="violet"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminActivityChart data={dailyActiveData} />
        <AdminOrgGrowthChart data={orgGrowthData} />
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold">Derniers utilisateurs inscrits</h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {u.firstName && u.lastName
                      ? `${u.firstName} ${u.lastName}`
                      : u.email}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      u.status === "ACTIVE"
                        ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                    }
                  >
                    {u.status === "ACTIVE" ? "Actif" : "Bloqué"}
                  </span>
                  <span className="whitespace-nowrap text-xs text-zinc-400">
                    {u.createdAt.toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orgs */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold">Dernières organisations</h3>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {org.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {org.slug} · {org.memberCount} membre(s) · {org.meetingCount} RDV
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-zinc-400">
                  {org.createdAt.toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
