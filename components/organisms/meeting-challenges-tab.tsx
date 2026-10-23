import { ChevronDown } from "lucide-react";
import { Visual3d, type Visual3dName } from "@/components/atoms/visual-3d";
import { ChallengesReviewCard } from "@/components/molecules/challenges-review-card";
import { KissResultView } from "@/components/molecules/kiss-result-view";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import {
  challengesForDisplay,
  type MeetingChallengeKind,
} from "@/src/core/domain/meeting-challenges";

const KIND: Record<
  MeetingChallengeKind,
  { label: string; visual: Visual3dName; tint: string }
> = {
  info: {
    label: "Une info à obtenir",
    visual: "b8-prospect",
    tint: "from-[#6C4DFF]/10",
  },
  phrase: {
    label: "Une phrase à dire",
    visual: "b9-objections",
    tint: "from-[#FF7A6B]/10",
  },
  geste: {
    label: "Un geste à faire",
    visual: "b3-coaching",
    tint: "from-[#FFB547]/12",
  },
};

/**
 * L'onglet des défis : trois petits défis à relire avant le prochain
 * rendez-vous, à la place des quatre listes KISS.
 *
 * Demande de Thomas du 23 octobre 2026 : « à la place du KISS, des petits
 * challenges avec une info à obtenir ou quelque chose à dire au prochain
 * rendez-vous », illustrés par les visuels 3D de la charte plutôt que par des
 * émoticônes. Le détail des quatre listes reste à portée, replié : il nourrit
 * aussi la synthèse d'équipe du manager.
 */
export function MeetingChallengesTab({
  meetingId,
  kiss,
  challenge,
  pending,
}: {
  meetingId: string;
  kiss: KissAnalysisResult | null;
  /** Le défi porté par la scorecard, pour les analyses anciennes. */
  challenge: string | null;
  pending: boolean;
}) {
  if (!kiss) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className={cardTitleClass}>Défis du prochain rendez-vous</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {pending
              ? "Vos défis sont en cours de rédaction…"
              : "Pas de défis pour ce rendez-vous."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const challenges = challengesForDisplay({
    challenges: kiss.challenges ?? null,
    goldenQuestion: kiss.goldenQuestion,
    challenge: kiss.challenge ?? challenge,
    start: kiss.start,
  });

  return (
    <div className="space-y-4">
      {kiss.challengesReview?.length ? (
        <ChallengesReviewCard
          review={kiss.challengesReview}
          meetingId={meetingId}
        />
      ) : null}

      <div>
        <h2 className={cardTitleClass}>Défis du prochain rendez-vous</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Relisez-les juste avant d&apos;entrer : au prochain rendez-vous, je
          vérifierai ceux que vous avez relevés.
        </p>
      </div>

      <ol className="grid gap-3">
        {challenges.map((d, i) => {
          const kind = KIND[d.kind];
          return (
            <li
              key={`${d.kind}-${i}`}
              className={cn(
                "flex gap-4 rounded-2xl border border-border/70 bg-gradient-to-br to-card p-5 shadow-[0_12px_24px_-16px_rgba(60,40,140,0.3)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 dark:border-neutral-800",
                kind.tint,
              )}
            >
              <Visual3d
                name={kind.visual}
                width={56}
                height={56}
                className="shrink-0 after:hidden"
              />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div>
                  <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.12em] uppercase">
                    Défi {i + 1} · {kind.label}
                  </p>
                  <p className="text-[15px] leading-snug font-semibold">
                    {d.title}
                  </p>
                </div>
                <p className="bg-card/80 rounded-xl border border-border/60 px-3.5 py-2.5 text-[14px] leading-relaxed dark:border-neutral-800">
                  {d.detail}
                </p>
                {d.why.trim() ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {d.why}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {kiss.summary.trim() ? (
        <Card className="border-brand/30 bg-brand-soft shadow-none dark:bg-brand/10">
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Le brief du coach</h2>
            <p className="text-[13.5px] leading-relaxed whitespace-pre-line">
              {kiss.summary.trim()}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <details className="group rounded-2xl border border-border bg-card p-5 dark:border-neutral-800">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold select-none">
          Le détail du coaching : à garder, à améliorer, à arrêter, à démarrer
          <ChevronDown
            className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="mt-4">
          <KissResultView result={kiss} />
        </div>
      </details>
    </div>
  );
}
