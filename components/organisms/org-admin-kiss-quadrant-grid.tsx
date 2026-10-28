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

/*
  Les fonds colorés des quatre cases et de leurs conseils (retour de Thomas
  du 28 octobre 2026 : « des fonds colorés sur les textes, pour que ce soit
  plus punchy, agréable à parcourir »). Chaque case reprend la couleur de sa
  pastille : la couleur dit la famille avant qu'on lise le titre.
*/
const TONE: Record<
  KissQuadrant["key"],
  { card: string; item: string; count: string }
> = {
  keep: {
    card: "border-t-[#33D1B5] bg-gradient-to-br from-[#33D1B5]/12 via-card to-card",
    item: "bg-[#33D1B5]/10 dark:bg-[#33D1B5]/12",
    count: "bg-[#33D1B5]/18 text-[#0B6E5C] dark:text-[#9EEEDF]",
  },
  improve: {
    card: "border-t-[#6C4DFF] bg-gradient-to-br from-[#6C4DFF]/10 via-card to-card",
    item: "bg-[#6C4DFF]/8 dark:bg-[#6C4DFF]/14",
    count: "bg-[#6C4DFF]/12 text-[#4527D6] dark:text-[#C9BDFF]",
  },
  start: {
    card: "border-t-[#FFB547] bg-gradient-to-br from-[#FFB547]/14 via-card to-card",
    item: "bg-[#FFB547]/12 dark:bg-[#FFB547]/12",
    count: "bg-[#FFB547]/18 text-[#8A5600] dark:text-[#FFD9A0]",
  },
  stop: {
    card: "border-t-[#FF7A6B] bg-gradient-to-br from-[#FF7A6B]/12 via-card to-card",
    item: "bg-[#FF7A6B]/10 dark:bg-[#FF7A6B]/12",
    count: "bg-[#FF7A6B]/15 text-[#A93A2C] dark:text-[#FFB3A9]",
  },
};

/*
  Les quatre pastilles gardent des icônes au trait, qui portent un sens
  précis ; leurs couleurs passent à la palette de la charte (audit du
  21 octobre 2026) : Keep turquoise, Improve violet, Start ambre, Stop
  corail.
*/
const quadrantsTeam: readonly KissQuadrant[] = [
  {
    key: "keep" as const,
    title: "À conserver (Keep)",
    subtitle: "Ce que l'équipe réussit déjà, à sécuriser",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass: "bg-[#33D1B5]/18 text-[#0B6E5C] dark:text-[#9EEEDF]",
  },
  {
    key: "improve" as const,
    title: "À améliorer (Improve)",
    subtitle: "Presque là, à affiner ensemble",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-[#6C4DFF]/12 text-[#4527D6] dark:text-[#C9BDFF]",
  },
  {
    key: "start" as const,
    title: "À démarrer (Start)",
    subtitle: "Le réflexe qui manque, à installer",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-[#FFB547]/18 text-[#8A5600] dark:text-[#FFD9A0]",
  },
  {
    key: "stop" as const,
    title: "À arrêter (Stop)",
    subtitle: "Ce qui coûte des rendez-vous, à couper",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-[#FF7A6B]/15 text-[#A93A2C] dark:text-[#FFB3A9]",
  },
];

/** Libellés orientés manager sur la fiche d’un commercial (≠ tableau de bord équipe). */
const quadrantsManagerMember: readonly KissQuadrant[] = [
  {
    key: "keep" as const,
    title: "À conserver (Keep)",
    subtitle: "Ses points forts, à valoriser au prochain point",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass: "bg-[#33D1B5]/18 text-[#0B6E5C] dark:text-[#9EEEDF]",
  },
  {
    key: "improve" as const,
    title: "À améliorer (Improve)",
    subtitle: "À améliorer ensemble, dès le prochain coaching",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-[#6C4DFF]/12 text-[#4527D6] dark:text-[#C9BDFF]",
  },
  {
    key: "start" as const,
    title: "À démarrer (Start)",
    subtitle: "Le réflexe à installer avec ce commercial",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-[#FFB547]/18 text-[#8A5600] dark:text-[#FFD9A0]",
  },
  {
    key: "stop" as const,
    title: "À arrêter (Stop)",
    subtitle: "À l'aider à couper, ça lui coûte des rendez-vous",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-[#FF7A6B]/15 text-[#A93A2C] dark:text-[#FFB3A9]",
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
    title: "À conserver (Keep)",
    subtitle: "Ce que vous réussissez, gardez-le tel quel",
    bulletsKey: "keepBullets" as const,
    icon: UserRound,
    iconWrapClass: "bg-[#33D1B5]/18 text-[#0B6E5C] dark:text-[#9EEEDF]",
  },
  {
    key: "improve" as const,
    title: "À améliorer (Improve)",
    subtitle: "Presque acquis, à affiner d'un cran",
    bulletsKey: "improveBullets" as const,
    icon: TrendingUp,
    iconWrapClass: "bg-[#6C4DFF]/12 text-[#4527D6] dark:text-[#C9BDFF]",
  },
  {
    key: "start" as const,
    title: "À démarrer (Start)",
    subtitle: "Le réflexe à installer dès le prochain rendez-vous",
    bulletsKey: "startBullets" as const,
    icon: Play,
    iconWrapClass: "bg-[#FFB547]/18 text-[#8A5600] dark:text-[#FFD9A0]",
  },
  {
    key: "stop" as const,
    title: "À arrêter (Stop)",
    subtitle: "À couper, ça vous coûte des rendez-vous",
    bulletsKey: "stopBullets" as const,
    icon: Ban,
    iconWrapClass: "bg-[#FF7A6B]/15 text-[#A93A2C] dark:text-[#FFB3A9]",
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
        const tone = TONE[q.key];
        return (
          <Card
            key={q.key}
            className={cn("border-t-4 shadow-sm dark:bg-zinc-900", tone.card)}
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
              <div className="min-w-0 flex-1">
                <CardTitle className={cardTitleClass}>{q.title}</CardTitle>
                {q.subtitle ? (
                  <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                    {q.subtitle}
                  </p>
                ) : null}
              </div>
              {bullets.length > 0 ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    tone.count,
                  )}
                >
                  {bullets.length}
                </span>
              ) : null}
            </CardHeader>
            <CardContent>
              <DotBulletList
                items={bullets}
                itemClassName={tone.item}
                emptyMessage="Aucune recommandation KISS sur la période. Lancez des analyses sur vos rendez-vous."
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
