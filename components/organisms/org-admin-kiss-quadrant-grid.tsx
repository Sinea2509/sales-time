import { DotBulletList } from "@/components/atoms/dot-bullet-list";
import { Ban, Play, TrendingUp, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { OrgAdminKissTeamRollup } from "@/src/core/application/get-org-admin-dashboard";

/**
 * À qui la grille parle. Les quatre cases et leurs puces sont les mêmes ; seul
 * le sous-titre change, parce qu'il dit au lecteur de qui il est question et
 * qu'un même texte ne peut pas s'adresser à la fois au manager et au commercial.
 */
export type OrgAdminKissQuadrantPresentation =
  | "teamDashboard"
  | "managerMemberProfile"
  | "sellerSelf";

type KissQuadrant = {
  key: "keep" | "improve" | "start" | "stop";
  title: string;
  subtitle: string;
  bulletsKey: keyof Pick<
    OrgAdminKissTeamRollup,
    "keepBullets" | "improveBullets" | "startBullets" | "stopBullets"
  >;
  icon: LucideIcon;
  iconWrapClass: string;
};

const quadrantsTeam: readonly KissQuadrant[] = [
  {
    key: "keep" as const,
    title: "Keep",
    subtitle: "Ce que l'équipe réussit déjà, à sécuriser",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
  },
  {
    key: "improve" as const,
    title: "Improve",
    subtitle: "Presque là, à affiner ensemble",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "start" as const,
    title: "Start",
    subtitle: "Le réflexe qui manque, à installer",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    key: "stop" as const,
    title: "Stop",
    subtitle: "Ce qui coûte des rendez-vous, à couper",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-red-600/15 text-red-700 dark:text-red-400",
  },
];

/** Libellés orientés manager sur la fiche d’un commercial (≠ tableau de bord équipe). */
const quadrantsManagerMember: readonly KissQuadrant[] = [
  {
    key: "keep" as const,
    title: "Keep",
    subtitle: "Ses points forts, à valoriser au prochain point",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
  },
  {
    key: "improve" as const,
    title: "Improve",
    subtitle: "À travailler ensemble, dès le prochain coaching",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "start" as const,
    title: "Start",
    subtitle: "Le réflexe à installer avec ce commercial",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    key: "stop" as const,
    title: "Stop",
    subtitle: "À l'aider à couper, ça lui coûte des rendez-vous",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-red-600/15 text-red-700 dark:text-red-400",
  },
];

/**
 * Les mêmes cases que `quadrantsTeam`, dites au commercial sur lui-même.
 *
 * Elles ne peuvent pas emprunter celles du manager : « à valoriser au prochain
 * point », « à l'aider à couper » demandent au lecteur d'encadrer quelqu'un.
 * Servies à un commercial qui lit sa propre fiche, elles lui feraient prendre
 * ses propres axes de progrès pour un plan de coaching à mener sur un tiers.
 */
const quadrantsSellerSelf: readonly KissQuadrant[] = [
  {
    key: "keep" as const,
    title: "Keep",
    subtitle: "Ce que vous réussissez, gardez-le tel quel",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass:
      "bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300",
  },
  {
    key: "improve" as const,
    title: "Improve",
    subtitle: "Presque acquis, à affiner d'un cran",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "start" as const,
    title: "Start",
    subtitle: "Le réflexe à installer dès le prochain rendez-vous",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  {
    key: "stop" as const,
    title: "Stop",
    subtitle: "À couper, ça vous coûte des rendez-vous",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-red-600/15 text-red-700 dark:text-red-400",
  },
];

/**
 * Un enregistrement plutôt qu'une suite de tests : ajouter une présentation
 * sans écrire ses libellés ne compile pas, au lieu de retomber en silence sur
 * ceux de l'équipe et de parler au lecteur de quelqu'un d'autre.
 */
const quadrantsParPresentation: Record<
  OrgAdminKissQuadrantPresentation,
  readonly KissQuadrant[]
> = {
  teamDashboard: quadrantsTeam,
  managerMemberProfile: quadrantsManagerMember,
  sellerSelf: quadrantsSellerSelf,
};

export function OrgAdminKissQuadrantGrid({
  rollup,
  presentation = "teamDashboard",
}: {
  rollup: OrgAdminKissTeamRollup;
  presentation?: OrgAdminKissQuadrantPresentation;
}) {
  const quadrants = quadrantsParPresentation[presentation];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {quadrants.map((q) => {
        const Icon = q.icon;
        const bullets = rollup[q.bulletsKey];
        return (
          <Card key={q.key} className="bg-card shadow-sm dark:bg-zinc-900">
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
                {q.subtitle ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {q.subtitle}
                  </p>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <DotBulletList
                items={bullets}
                density="comfortable"
                emptyMessage="Aucune recommandation KISS sur la période. Lancez des analyses sur vos rendez-vous."
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
