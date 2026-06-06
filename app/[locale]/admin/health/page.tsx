import { getApplicationDeps } from "@/lib/application-deps";
import { AdminHealthDashboard } from "@/components/organisms/admin-health-dashboard";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const now = new Date();
  const deps = getApplicationDeps();

  const [dbHealth, counts] = await Promise.all([
    deps.platformHealth.measureSelectOneLatency(),
    deps.platformHealth.getAdminHealthCounts(now),
  ]);

  return (
    <AdminHealthDashboard
      dbHealth={dbHealth}
      counts={counts}
      now={now}
      region={process.env.VERCEL_REGION ?? "local"}
      nodeEnv={process.env.NODE_ENV ?? "unknown"}
      nextVersion="16.2.4"
    />
  );
}
