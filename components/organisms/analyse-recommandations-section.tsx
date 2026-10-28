"use client";

import { LineChart, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DotBulletList } from "@/components/atoms/dot-bullet-list";
import { IconCardHeader } from "@/components/molecules/icon-card-header";
import { cardTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import {
  SalesProfileRadar,
  type SalesProfileScores,
} from "@/components/organisms/sales-profile-radar";
import {
  MIN_ANALYZED_RDV_FOR_PROGRESS,
  coachingProgressBulletsForDisplay,
} from "@/src/core/domain/coaching-progress-eligibility";
import { SalesProfileEvolutionList } from "@/components/molecules/sales-profile-evolution-list";
import { SalesProfileTrajectory } from "@/components/molecules/sales-profile-trajectory";
import type { StatsWindowDays } from "@/src/core/domain/dashboard-stats-window";
import type { SalesProfilePeriodPoint } from "@/src/core/domain/sales-profile-history";

export function AnalyseRecommandationsSection({
  salesProfile,
  previousSalesProfile = null,
  rdvCount,
  progressBullets,
  improvementBullets,
  isOrgAdmin,
  sellerScoped = false,
  statsWindowDays,
  profileHistory,
}: {
  salesProfile: SalesProfileScores | null;
  previousSalesProfile?: SalesProfileScores | null;
  rdvCount: number;
  progressBullets: string[];
  improvementBullets: string[];
  isOrgAdmin: boolean;
  /** Manager view of one commercial : seller-specific copy instead of team/self. */
  sellerScoped?: boolean;
  /** Fenêtre stats active, pour le « vs N j. préc. » de la croissance. */
  statsWindowDays?: StatsWindowDays;
  /** Trajectoire du profil global sur plusieurs périodes. Absente sur la fiche. */
  profileHistory?: SalesProfilePeriodPoint[];
}) {
  const profileTitle = sellerScoped
    ? "Profil de vente du commercial"
    : isOrgAdmin
      ? "Profil de vente de l'équipe"
      : "Mon profil de vente";
  const progressTitle = sellerScoped
    ? "Progrès du commercial"
    : isOrgAdmin
      ? "Progrès de l'équipe"
      : "Mes progrès";
  const progressSubtitle = sellerScoped
    ? "Ce que le commercial a amélioré"
    : isOrgAdmin
      ? "Ce que l'équipe a amélioré"
      : "Ce que vous avez amélioré";
  const improvementSubtitle = sellerScoped
    ? "Ce que le commercial devrait commencer à faire"
    : isOrgAdmin
      ? "Ce que l'équipe devrait commencer à faire"
      : "Ce que vous devriez commencer à faire";
  const improvementTitle = sellerScoped
    ? "Axes d'amélioration du commercial"
    : isOrgAdmin
      ? "Axes d'amélioration de l'équipe"
      : "Mes axes d'amélioration";
  const visibleProgressBullets = coachingProgressBulletsForDisplay(
    rdvCount,
    progressBullets,
  );
  /*
    Sans ces deux messages, les cartes « Progrès » et « Axes d'amélioration »
    se réduisent à leur titre : 97 pixels de haut, un intitulé, un sous-titre,
    et rien dessous. DotBulletList renvoie null quand la liste est vide et
    qu'aucun message ne lui est fourni. Or « Progrès » se vide très souvent,
    puisque deux rendez-vous notés sont exigés avant toute comparaison, et le
    lecteur n'a alors aucun moyen de distinguer « pas encore assez de données »
    de « aucun progrès ».
  */
  const progressEmptyMessage =
    rdvCount < MIN_ANALYZED_RDV_FOR_PROGRESS
      ? `Un progrès se mesure d'un rendez-vous à l'autre : il en faut au moins deux notés par l'analyse KISS. ${rdvCount === 0 ? "Aucun ne l'est encore" : "Un seul l'est pour l'instant"}.`
      : "Aucun progrès n'a été relevé sur cette période.";
  const improvementEmptyMessage =
    rdvCount === 0
      ? "Les axes d'amélioration arrivent avec la première analyse KISS."
      : "Aucun axe d'amélioration n'a été relevé sur cette période.";
  /*
    Le profil vient désormais des six notes que l'analyse KISS porte sur le
    commercial. L'ancien message invitait à lancer « SONCAS, DISC ou KISS »,
    ce qui était vrai du calcul d'alors et faux de celui-ci : SONCAS et DISC
    décrivent le prospect. Il ne disait pas non plus quoi faire des rendez-vous
    déjà analysés, qui portent une analyse KISS valide mais dépourvue des six
    notes, et dont le commercial ne verrait sinon jamais pourquoi ils ne
    comptent pas.
  */
  const cible = sellerScoped
    ? "les rendez-vous du commercial"
    : isOrgAdmin
      ? "les rendez-vous de l'équipe"
      : "vos rendez-vous";
  const profileEmptyMessage = `Le profil se lit sur l'analyse KISS, qui note six compétences de vente à chaque rendez-vous. Lancez-la sur ${cible} pour le construire. Les rendez-vous analysés avant la mise à jour ne portent pas encore ces six notes : relancer leur analyse KISS les y fait entrer.`;

  return (
    <div
      className="grid gap-4 lg:grid-cols-2 lg:items-start"
      data-feedback-id="analyse-recommandations"
    >
      <Card className="flex flex-col border-border shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={cardTitleClass}>{profileTitle}</CardTitle>
          {/*
            « RDV » est un sigle, donc invariable : le pluriel se lit sur le
            nombre et sur l'adjectif, jamais sur le sigle. Et sans profil il n'y
            a rien à compter : « sur 0 rdv » sous un radar absent décrit le vide
            une seconde fois, alors que le message de la carte dit déjà quoi
            faire pour le remplir.
          */}
          {salesProfile ? (
            <CardDescription>
              moyenne sur {rdvCount} RDV {plurielFr(rdvCount, "analysé")}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center">
          {salesProfile ? (
            <>
              <SalesProfileRadar
                scores={salesProfile}
                previousScores={previousSalesProfile}
              />
              {profileHistory ? (
                <SalesProfileTrajectory
                  history={profileHistory}
                  statsWindowDays={statsWindowDays}
                />
              ) : null}
              <SalesProfileEvolutionList
                scores={salesProfile}
                previousScores={previousSalesProfile}
                rdvCount={rdvCount}
                statsWindowDays={statsWindowDays}
              />
            </>
          ) : (
            <p className="text-muted-foreground mx-auto max-w-prose py-12 text-center text-sm">
              {profileEmptyMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col border-t-4 border-border border-t-[#33D1B5] bg-gradient-to-br from-[#33D1B5]/10 via-card to-card shadow-sm dark:border-neutral-800 dark:border-t-[#33D1B5]">
          <IconCardHeader
            icon={LineChart}
            title={progressTitle}
            description={progressSubtitle}
            iconWrapClassName="bg-[#33D1B5]/18"
            iconClassName="text-[#0B6E5C] dark:text-[#9EEEDF]"
          />
          <CardContent className="flex-1">
            <DotBulletList
              items={visibleProgressBullets}
              itemClassName="bg-[#33D1B5]/10 dark:bg-[#33D1B5]/12"
              emptyMessage={progressEmptyMessage}
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col border-t-4 border-border border-t-[#6C4DFF] bg-gradient-to-br from-[#6C4DFF]/8 via-card to-card shadow-sm dark:border-neutral-800 dark:border-t-[#6C4DFF]">
          <IconCardHeader
            icon={Play}
            title={improvementTitle}
            description={improvementSubtitle}
            iconWrapClassName="bg-[#6C4DFF]/12"
            iconClassName="fill-[#6C4DFF] text-[#6C4DFF] dark:fill-[#C9BDFF] dark:text-[#C9BDFF]"
          />
          <CardContent className="flex-1">
            <DotBulletList
              items={improvementBullets}
              itemClassName="bg-[#6C4DFF]/8 dark:bg-[#6C4DFF]/14"
              emptyMessage={improvementEmptyMessage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
