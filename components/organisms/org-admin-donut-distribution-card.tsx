import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";
import type { OrgAdminDistributionPie } from "@/src/core/application/get-org-admin-dashboard";

const INSUFFICIENT_PROFILE_MESSAGE =
  "Pas assez de données pour un profil fiable.";

function conicGradientStops(slices: OrgAdminDistributionPie["slices"]) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return null;
  let acc = 0;
  const parts: string[] = [];
  for (const s of slices) {
    const pct = (s.value / total) * 100;
    const start = acc;
    acc += pct;
    parts.push(`${s.color} ${start}% ${acc}%`);
  }
  return parts.join(", ");
}

export function OrgAdminDonutDistributionCard({
  title,
  data,
}: {
  title: string;
  data: OrgAdminDistributionPie;
}) {
  const total = data.slices.reduce((a, s) => a + s.value, 0);
  const gradient = conicGradientStops(data.slices);
  const rdvCount = data.analyzedMeetings;
  const showChart =
    data.analyzedMeetings >= MIN_RDV_FOR_STATS && gradient != null;

  const description = data.isDefaultEqual
    ? "Répartition par défaut (parts égales) — en attente d'analyses"
    : `Moyenne équipe sur ${rdvCount} RDV analysé${rdvCount > 1 ? "s" : ""}`;

  return (
    <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
      <CardHeader>
        <CardTitle className={cardTitleClass}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!showChart ? (
          <p className="text-muted-foreground text-sm">
            {data.analyzedMeetings < MIN_RDV_FOR_STATS
              ? INSUFFICIENT_PROFILE_MESSAGE
              : "Pas assez de données sur la période sélectionnée."}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
            <div className="relative size-44 shrink-0 sm:size-52">
              <div
                className="absolute inset-0 rounded-full shadow-inner ring-1 ring-black/5 dark:ring-white/10"
                style={{ background: `conic-gradient(${gradient})` }}
                aria-hidden
              />
              <div className="absolute inset-[32%] flex items-center justify-center rounded-full bg-white text-center dark:bg-zinc-900">
                <span className="text-muted-foreground text-xs font-medium tabular-nums">
                  {data.isDefaultEqual ? 0 : rdvCount}
                  <span className="block text-[10px] font-normal">RDV</span>
                </span>
              </div>
            </div>
            <ul className="w-full max-w-xs space-y-2 text-sm">
              {data.slices.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-0 dark:border-zinc-800"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: s.color }}
                      aria-hidden
                    />
                    <span className="truncate text-zinc-800 dark:text-zinc-200">
                      {s.label}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {Math.round((100 * s.value) / total)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
