import { Ban, Play, TrendingUp, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { OrgAdminKissTeamRollup } from "@/src/core/application/get-org-admin-dashboard";

export type OrgAdminKissQuadrantPresentation =
  | "teamDashboard"
  | "managerMemberProfile";

const quadrantsTeam = [
  {
    key: "keep" as const,
    title: "Keep",
    subtitle: "Ce que votre équipe a bien fait",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
  },
  {
    key: "improve" as const,
    title: "Improve",
    subtitle: "Ce que votre équipe peut améliorer",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "start" as const,
    title: "Start",
    subtitle: "Ce que votre équipe devrait commencer à faire",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    key: "stop" as const,
    title: "Stop",
    subtitle: "Ce que votre équipe devrait arrêter",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-red-600/15 text-red-700 dark:text-red-400",
  },
] as const;

/** Libellés orientés manager sur la fiche d’un commercial (≠ tableau de bord équipe). */
const quadrantsManagerMember = [
  {
    key: "keep" as const,
    title: "Keep",
    subtitle: "Ce que vous devez continuer à valoriser",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
  },
  {
    key: "improve" as const,
    title: "Improve",
    subtitle: "Sujets de coaching à adresser",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "start" as const,
    title: "Start",
    subtitle: "Type de rituels à lancer",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    key: "stop" as const,
    title: "Stop",
    subtitle: "Comportements managériaux à éviter",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-red-600/15 text-red-700 dark:text-red-400",
  },
] as const;

function KissQuadrantBulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        Aucune recommandation KISS sur la période — lancez des analyses sur vos
        rendez-vous.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      {items.map((line) => (
        <li key={line} className="flex items-start gap-2.5">
          <span
            className="mt-2 inline-block size-1.5 shrink-0 rounded-full bg-neutral-400 dark:bg-neutral-500"
            aria-hidden
          />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrgAdminKissQuadrantGrid({
  rollup,
  presentation = "teamDashboard",
}: {
  rollup: OrgAdminKissTeamRollup;
  presentation?: OrgAdminKissQuadrantPresentation;
}) {
  const quadrants =
    presentation === "managerMemberProfile"
      ? quadrantsManagerMember
      : quadrantsTeam;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quadrants.map((q) => {
        const Icon = q.icon;
        const bullets = rollup[q.bulletsKey];
        return (
          <Card key={q.key} className="bg-white shadow-sm dark:bg-zinc-900">
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
                <CardTitle className={cardTitleClass}>{q.title}</CardTitle>
                {"subtitle" in q && q.subtitle ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {q.subtitle}
                  </p>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <KissQuadrantBulletList items={bullets} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
