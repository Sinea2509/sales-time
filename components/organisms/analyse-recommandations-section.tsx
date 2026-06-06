"use client";

import { LineChart, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import {
  SalesProfileRadar,
  type SalesProfileScores,
} from "@/components/organisms/sales-profile-radar";

function CoachingBulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
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

export function AnalyseRecommandationsSection({
  salesProfile,
  previousSalesProfile = null,
  rdvCount,
  progressBullets,
  improvementBullets,
  isOrgAdmin,
}: {
  salesProfile: SalesProfileScores | null;
  previousSalesProfile?: SalesProfileScores | null;
  rdvCount: number;
  progressBullets: string[];
  improvementBullets: string[];
  isOrgAdmin: boolean;
}) {
  const profileTitle = isOrgAdmin
    ? "Profil de vente de l'équipe"
    : "Mon profil de vente";
  const progressTitle = isOrgAdmin ? "Progrès de l'équipe" : "Mes progrès";
  const progressSubtitle = isOrgAdmin
    ? "Ce que l'équipe a amélioré"
    : "Ce que vous avez amélioré";
  const improvementSubtitle = isOrgAdmin
    ? "Ce que l'équipe devrait commencer à faire"
    : "Ce que vous devriez commencer à faire";
  const improvementTitle = isOrgAdmin
    ? "Axes d'amélioration de l'équipe"
    : "Mes axes d'amélioration";

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
      <Card className="flex h-full flex-col border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className={cardTitleClass}>{profileTitle}</CardTitle>
          <CardDescription>
            sur {rdvCount} rdv{rdvCount > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center">
          {salesProfile ? (
            <SalesProfileRadar
              scores={salesProfile}
              previousScores={previousSalesProfile}
            />
          ) : (
            <p className="text-muted-foreground py-12 text-center text-sm">
              Lancez des analyses SONCAS, DISC ou KISS sur vos rendez-vous pour
              construire le profil de vente.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex h-full flex-col gap-4">
        <Card className="flex flex-1 flex-col border-neutral-200 shadow-sm dark:border-neutral-800">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/15">
                <LineChart className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className={cardTitleClass}>{progressTitle}</CardTitle>
                <CardDescription>{progressSubtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <CoachingBulletList items={progressBullets} />
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col border-neutral-200 shadow-sm dark:border-neutral-800">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
                <Play className="size-5 fill-violet-600 text-violet-600 dark:fill-violet-400 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className={cardTitleClass}>
                  {improvementTitle}
                </CardTitle>
                <CardDescription>{improvementSubtitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <CoachingBulletList items={improvementBullets} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
