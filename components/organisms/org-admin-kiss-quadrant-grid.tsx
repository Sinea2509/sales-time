import { Ban, Play, TrendingUp, UserRound } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrgAdminKissTeamRollup } from "@/src/core/application/get-org-admin-dashboard";

const quadrants = [
  {
    key: "keep" as const,
    title: "Keep",
    subtitle: "Ce que votre équipe fait bien et doit continuer",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800/70",
  },
  {
    key: "improve" as const,
    title: "Improve",
    subtitle: "Ce que votre équipe peut renforcer",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-900/60",
  },
  {
    key: "start" as const,
    title: "Start",
    subtitle: "Ce que votre équipe devrait commencer à faire",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    borderClass: "border-violet-200 dark:border-violet-900/60",
  },
  {
    key: "stop" as const,
    title: "Stop",
    subtitle: "Ce que votre équipe devrait arrêter",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-red-600/15 text-red-700 dark:text-red-400",
    borderClass: "border-red-300 dark:border-red-900/60",
  },
] as const;

export function OrgAdminKissQuadrantGrid({
  rollup,
}: {
  rollup: OrgAdminKissTeamRollup;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quadrants.map((q) => {
        const Icon = q.icon;
        const count = rollup[q.bulletsKey];
        return (
          <Card
            key={q.key}
            className={cn(
              "border-2 bg-white shadow-sm dark:bg-zinc-900",
              q.borderClass,
            )}
          >
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
              <span
                className={cn(
                  "flex h-10 min-w-10 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5",
                  q.iconWrapClass,
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base">{q.title}</CardTitle>
                {"subtitle" in q && q.subtitle ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {q.subtitle}
                  </p>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground text-3xl font-semibold tabular-nums tracking-tight">
                {count}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
