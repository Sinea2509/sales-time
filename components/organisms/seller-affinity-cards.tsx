import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import { GuideDeGrille } from "@/components/molecules/reference-commerciale";
import { GRILLE_DISC, GRILLE_SONCAS } from "@/lib/grilles-commerciales";
import { cardTitleClass } from "@/lib/page-typography";
import { MIN_RDV_FOR_STATS } from "@/src/core/domain/dashboard-stats-window";

export type AffinityBarItem = {
  key: string;
  label: string;
  pct: number;
  barClass: string;
};

/**
 * Phrase d'attente d'un profil, avec les deux chiffres qui la justifient.
 *
 * « Pas assez de données » ne dit ni combien il en manque, ni quand cela
 * changera : le lecteur ne sait pas s'il doit attendre un rendez-vous ou dix.
 */
export function profilEnAttente(analyses: number, minimum: number): string {
  const compte =
    analyses === 0
      ? "Aucun rendez-vous analysé"
      : analyses === 1
        ? "1 rendez-vous analysé"
        : `${analyses} rendez-vous analysés`;
  return `${compte} sur la période : le profil s'affiche à partir de ${minimum}.`;
}

/**
 * Les deux cartes d'affinité relationnelle d'un commercial : avec quels
 * styles DISC et quels leviers SONCAS il obtient ses meilleurs rendez-vous.
 * Les mêmes cartes chez le manager et chez le commercial ; seule la voix des
 * sous-titres change.
 */
export function SellerAffinityCards({
  discBarItems,
  soncasBarItems,
  discAnalyzedMeetings,
  soncasAnalyzedMeetings,
  discAffinityText,
  soncasAffinityText,
  perspective,
}: {
  discBarItems: AffinityBarItem[];
  soncasBarItems: AffinityBarItem[];
  discAnalyzedMeetings: number;
  soncasAnalyzedMeetings: number;
  discAffinityText: string | null;
  soncasAffinityText: string | null;
  perspective: "manager" | "commercial";
}) {
  const qui = perspective === "manager" ? "ce commercial" : "vous";
  const obtient = perspective === "manager" ? "obtient" : "obtenez";
  const active = perspective === "manager" ? "active" : "activez";
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card
        size="sm"
        className="border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <CardHeader className="gap-2 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil DISC
            </CardTitle>
            <GuideDeGrille grille={GRILLE_DISC} className="mt-0.5 shrink-0" />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Les styles de communication avec lesquels {qui} {obtient}{" "}
            {perspective === "manager" ? "ses" : "vos"} meilleurs rendez-vous.
            Touchez un profil pour savoir comment s&apos;y adapter.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {discAnalyzedMeetings >= MIN_RDV_FOR_STATS ? (
            <ProfileAffinityHorizontalBars
              items={discBarItems}
              grilleCle="disc"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {profilEnAttente(discAnalyzedMeetings, MIN_RDV_FOR_STATS)}
            </p>
          )}
          {discAffinityText?.trim() ? (
            <p className="text-muted-foreground mt-5 border-t border-border pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
              {discAffinityText.trim()}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Card
        size="sm"
        className="border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <CardHeader className="gap-2 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil SONCAS
            </CardTitle>
            <GuideDeGrille grille={GRILLE_SONCAS} className="mt-0.5 shrink-0" />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Les motivations d&apos;achat que {qui} {active} le mieux. Touchez un
            levier pour savoir comment l&apos;activer.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {soncasAnalyzedMeetings >= MIN_RDV_FOR_STATS ? (
            <ProfileAffinityHorizontalBars
              items={soncasBarItems}
              grilleCle="soncas"
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              {profilEnAttente(soncasAnalyzedMeetings, MIN_RDV_FOR_STATS)}
            </p>
          )}
          {soncasAffinityText?.trim() ? (
            <p className="text-muted-foreground mt-5 border-t border-border pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
              {soncasAffinityText.trim()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
