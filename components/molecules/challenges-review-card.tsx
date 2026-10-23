"use client";

import { useEffect, useState } from "react";
import { Check, CircleDashed, CircleDot } from "lucide-react";
import { SparkBurst } from "@/components/atoms/spark-burst";
import { Visual3d, type Visual3dName } from "@/components/atoms/visual-3d";
import { cn } from "@/lib/utils";
import type {
  ChallengeReview,
  ChallengeReviewStatus,
  MeetingChallengeKind,
} from "@/src/core/domain/meeting-challenges";

const VISUAL: Record<MeetingChallengeKind, Visual3dName> = {
  info: "b8-prospect",
  phrase: "b9-objections",
  geste: "b3-coaching",
};

const STATUS: Record<
  ChallengeReviewStatus,
  { label: string; className: string; icon: typeof Check }
> = {
  releve: {
    label: "Relevé",
    className:
      "bg-[#33D1B5]/18 text-[#0B6E5C] ring-[#33D1B5]/50 dark:text-[#9EEEDF]",
    icon: Check,
  },
  partiel: {
    label: "En partie",
    className:
      "bg-[#FFB547]/18 text-[#8A5600] ring-[#FFB547]/50 dark:text-[#FFD9A0]",
    icon: CircleDot,
  },
  non_releve: {
    label: "Pas encore",
    className: "bg-muted text-muted-foreground ring-border",
    icon: CircleDashed,
  },
};

const dateLongue = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

function seenKey(meetingId: string): string {
  return `st-challenges-vus:${meetingId}`;
}

/**
 * Le bilan des défis laissés au rendez-vous précédent avec ce contact :
 * relevé, en partie ou pas encore, avec les mots du transcript qui le
 * prouvent. Un défi relevé est fêté la première fois qu'on ouvre la fiche.
 *
 * Demande de Thomas du 23 octobre 2026 : que les défis aient une suite, et
 * que la réussite se voie.
 */
export function ChallengesReviewCard({
  review,
  meetingId,
}: {
  review: ChallengeReview[];
  meetingId: string;
}) {
  const [celebrate, setCelebrate] = useState(false);
  const doneCount = review.filter((r) => r.status === "releve").length;

  useEffect(() => {
    if (doneCount === 0) return;
    try {
      if (window.localStorage.getItem(seenKey(meetingId)) === "1") return;
      window.localStorage.setItem(seenKey(meetingId), "1");
    } catch {
      return;
    }
    const start = window.setTimeout(() => setCelebrate(true), 300);
    const stop = window.setTimeout(() => setCelebrate(false), 2600);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [doneCount, meetingId]);

  if (review.length === 0) return null;
  const date = review[0]?.fromMeetingAt
    ? dateLongue.format(new Date(review[0].fromMeetingAt))
    : null;
  const tous = doneCount === review.length;

  return (
    <section className="st-medal-anim rounded-2xl border border-[#33D1B5]/40 bg-[linear-gradient(135deg,rgba(51,209,181,0.10),rgba(108,77,255,0.05)_60%,transparent)] bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">
          Vos défis du rendez-vous précédent
          {date ? (
            <span className="text-muted-foreground font-normal">
              {" "}
              du {date}
            </span>
          ) : null}
        </h2>
        <p className="text-sm font-semibold tabular-nums">
          {tous
            ? "Tous relevés, bravo !"
            : `${doneCount} relevé${doneCount > 1 ? "s" : ""} sur ${review.length}`}
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {review.map((r, i) => {
          const status = STATUS[r.status];
          const Icon = status.icon;
          return (
            <li key={`${r.kind}-${i}`} className="flex gap-3">
              <Visual3d
                name={VISUAL[r.kind]}
                width={36}
                height={36}
                className="shrink-0 after:hidden"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <span
                    className={cn(
                      "relative inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                      status.className,
                    )}
                    style={
                      celebrate && r.status === "releve"
                        ? {
                            animation: `st-medal-pop 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.15}s both`,
                          }
                        : undefined
                    }
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {status.label}
                    {celebrate && r.status === "releve" ? (
                      <SparkBurst count={6} />
                    ) : null}
                  </span>
                </div>
                {r.evidence ? (
                  <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed italic">
                    « {r.evidence} »
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
                    {r.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
