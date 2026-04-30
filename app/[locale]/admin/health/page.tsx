import {
  Database,
  HeartPulse,
  Server,
  Clock,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  KeyRound,
  TimerOff,
  MailPlus,
} from "lucide-react";
import { getApplicationDeps } from "@/lib/application-deps";
import { AdminKpiCard } from "@/components/molecules/admin-kpi-card";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

function dbStatusColor(ms: number, ok: boolean) {
  if (!ok) return "text-red-600 dark:text-red-400";
  if (ms < 100) return "text-emerald-600 dark:text-emerald-400";
  if (ms <= 500) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function dbStatusLabel(ms: number, ok: boolean) {
  if (!ok) return "Erreur";
  if (ms < 100) return "Sain";
  if (ms <= 500) return "Lent";
  return "Critique";
}

function dbBadgeClasses(ms: number, ok: boolean) {
  if (!ok)
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300";
  if (ms < 100)
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (ms <= 500)
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300";
}

export default async function HealthPage() {
  const now = new Date();
  const deps = getApplicationDeps();

  const [dbHealth, counts] = await Promise.all([
    deps.platformHealth.measureSelectOneLatency(),
    deps.platformHealth.getAdminHealthCounts(now),
  ]);

  const {
    userCount,
    orgCount,
    meetingCount,
    analysisCount,
    sessionCount,
    activeSessions,
    expiredSessions,
    pendingOrgInvitations,
    pendingSuperAdminInvitations,
  } = counts;

  const totalDbRows =
    userCount + orgCount + meetingCount + analysisCount + sessionCount;
  const pendingInvitations = pendingOrgInvitations + pendingSuperAdminInvitations;

  const region = process.env.VERCEL_REGION ?? "local";
  const nodeEnv = process.env.NODE_ENV ?? "unknown";
  const nextVersion = "16.2.4";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Santé système</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          État de l&apos;infrastructure et métriques de la base de données.
        </p>
      </div>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4" />
            Base de données
          </CardTitle>
          <CardDescription>Connectivité et latence PostgreSQL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  dbHealth.ok
                    ? "bg-emerald-50 dark:bg-emerald-950/40"
                    : "bg-red-50 dark:bg-red-950/40",
                )}
              >
                <HeartPulse
                  className={cn("size-5", dbStatusColor(dbHealth.ms, dbHealth.ok))}
                />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {dbHealth.ms}
                  <span className="text-sm font-medium text-zinc-500"> ms</span>
                </p>
                <p className="text-xs text-zinc-500">Latence</p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                dbBadgeClasses(dbHealth.ms, dbHealth.ok),
              )}
            >
              {dbStatusLabel(dbHealth.ms, dbHealth.ok)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* DB Row Counts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminKpiCard
          icon={Database}
          label="Lignes totales DB"
          value={totalDbRows.toLocaleString("fr-FR")}
          accent="blue"
        />
        <AdminKpiCard icon={Users} label="Utilisateurs" value={userCount} accent="blue" />
        <AdminKpiCard
          icon={Building2}
          label="Organisations"
          value={orgCount}
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
          value={analysisCount}
          accent="amber"
        />
        <AdminKpiCard
          icon={KeyRound}
          label="Sessions (total)"
          value={sessionCount}
          accent="blue"
        />
      </div>

      {/* Sessions & Invitations */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminKpiCard
          icon={KeyRound}
          label="Sessions actives"
          value={activeSessions}
          footer="expiresAt > maintenant"
          accent="emerald"
        />
        <AdminKpiCard
          icon={TimerOff}
          label="Sessions expirées"
          value={expiredSessions}
          footer="Candidats au nettoyage"
          accent="amber"
        />
        <AdminKpiCard
          icon={MailPlus}
          label="Invitations en attente"
          value={pendingInvitations}
          footer={`${pendingOrgInvitations} org · ${pendingSuperAdminInvitations} super admin`}
          accent="violet"
        />
      </div>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4" />
            Environnement
          </CardTitle>
          <CardDescription>Informations sur le runtime et le déploiement</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">NODE_ENV</dt>
              <dd className="mt-0.5 text-sm font-semibold">{nodeEnv}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Région</dt>
              <dd className="mt-0.5 text-sm font-semibold">{region}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Next.js</dt>
              <dd className="mt-0.5 text-sm font-semibold">v{nextVersion}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Timestamp */}
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        <Clock className="mr-1 inline size-3" />
        Dernière vérification :{" "}
        {now.toLocaleString("fr-FR", {
          dateStyle: "medium",
          timeStyle: "medium",
        })}
      </p>
    </div>
  );
}
