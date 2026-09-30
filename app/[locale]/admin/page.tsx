import {
  Users,
  Building2,
  Calendar,
  LineChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  DollarSign,
  AlertTriangle,
  Hourglass,
  Target,
  UserPlus,
} from "lucide-react";
import { getApplicationDeps } from "@/lib/application-deps";
import { getPlatformAiKpis } from "@/src/core/application/get-platform-ai-kpis";
import { AdminRecentActivitySection } from "@/components/organisms/admin-recent-activity-section";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { PageHeader } from "@/components/molecules/page-header";
import { AdminActivityChart } from "@/components/organisms/admin-activity-chart";
import { AdminOrgGrowthChart } from "@/components/organisms/admin-org-growth-chart";
import { AdminDateRangePicker } from "@/components/molecules/admin-date-range-picker";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";

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
  const since30d = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const deps = getApplicationDeps();
  const [bundle, aiKpis] = await Promise.all([
    deps.backoffice.getAdminDashboardBundle({ rangeDays, now }),
    getPlatformAiKpis(deps, since30d),
  ]);
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
    activation,
    trialExhaustedOrgs,
    recentUsers,
    recentOrgs,
    dailyActiveData,
    orgGrowthData,
  } = bundle;

  function formatHoursFr(hours: number): string {
    if (hours < 48) return `${hours} h`;
    return `${Math.round(hours / 24)} j`;
  }

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
      <PageHeader
        title="Tableau de bord plateforme"
        description="Vue d'ensemble de l'activité et des KPIs SaaS de Sales Time."
        actions={<AdminDateRangePicker />}
      />

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
          icon={Calendar}
          label="Rendez-vous totaux"
          value={totalMeetings}
          footer={`${avgMeetingsPerOrg} moy. / org`}
          accent="emerald"
        />
        <AdminKpiCard
          icon={LineChart}
          label="Analyses totales"
          value={totalAnalyses}
          footer={`${avgAnalysesPerMeeting} moy. / RDV`}
          accent="amber"
        />
      </div>

      {/* Platform ops */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={DollarSign}
          label={`Coût IA estimé (${rangeDays}j)`}
          value={`$${aiKpis.estimatedCostUsd30d}`}
          footer={`${aiKpis.aiCalls30d} appels · ${aiKpis.aiErrors30d} erreurs`}
          accent="amber"
        />
        <AdminKpiCard
          icon={AlertTriangle}
          label="Taux d'échec analyse"
          value={
            aiKpis.analysisFailureRatePct != null
              ? `${aiKpis.analysisFailureRatePct}%`
              : VALEUR_NON_CALCULABLE
          }
          footer={`${aiKpis.failedMeetings} échecs / ${aiKpis.readyMeetings} OK`}
          accent="violet"
        />
      </div>

      {/*
        L'activation avant l'engagement : un inscrit qui n'a jamais analysé n'a
        jamais vu le produit, et aucun chiffre d'usage ne le rattrapera.
      */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          icon={UserPlus}
          label={`Inscrits (${rangeDays}j)`}
          value={activation.signups}
          footer={`${activation.activated} ont analysé au moins un RDV`}
          accent="blue"
        />
        <AdminKpiCard
          icon={Target}
          label="Taux d'activation"
          value={
            activation.activationRatePct != null
              ? `${activation.activationRatePct}%`
              : VALEUR_NON_CALCULABLE
          }
          footer={
            activation.activationRatePct != null
              ? "Inscrits avec un premier RDV analysé"
              : "Aucun inscrit sur la période"
          }
          accent="emerald"
        />
        <AdminKpiCard
          icon={Hourglass}
          label="Délai médian du 1er RDV"
          value={
            activation.medianHoursToFirstMeeting != null
              ? formatHoursFr(activation.medianHoursToFirstMeeting)
              : VALEUR_NON_CALCULABLE
          }
          footer="Entre l'inscription et le premier rendez-vous enregistré"
          accent="violet"
        />
        <AdminKpiCard
          icon={AlertTriangle}
          label="Essais épuisés"
          value={trialExhaustedOrgs}
          footer="Organisations à 0 analyse restante, sans plan : à relancer"
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
          icon={Calendar}
          label={`RDV (${rangeDays} jours)`}
          value={meetings30d}
          trend={meetingsTrend}
          footer={`vs. ${rangeDays} jours précédents`}
          accent="emerald"
        />
        <AdminKpiCard
          icon={LineChart}
          label={`Analyses (${rangeDays} jours)`}
          value={analyses30d}
          footer="Sur la période glissante"
          accent="blue"
        />
        <AdminKpiCard
          icon={TrendingDown}
          label="Stickiness (DAU/MAU)"
          value={
            mau > 0
              ? `${Math.round((dau / mau) * 100)}%`
              : VALEUR_NON_CALCULABLE
          }
          footer={
            mau > 0
              ? "Ratio d'engagement quotidien"
              : "Aucun utilisateur actif sur la période"
          }
          accent="violet"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminActivityChart data={dailyActiveData} />
        <AdminOrgGrowthChart data={orgGrowthData} />
      </div>

      <AdminRecentActivitySection
        recentUsers={recentUsers}
        recentOrgs={recentOrgs}
      />
    </div>
  );
}
