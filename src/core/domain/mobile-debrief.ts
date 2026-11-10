import { salesScoreForMeeting } from "@/src/core/domain/dashboard-sales-score";
import { parseFollowUpEmailDraft } from "./format-follow-up-email-draft";
import { kissResultSchema } from "./kiss-result-zod";
import {
  challengesForDisplay,
  type MeetingChallenge,
} from "./meeting-challenges";

/**
 * Ce que le commercial retrouve sur son téléphone après un rendez-vous : sa
 * note, ses défis pour la suite, le mail de suivi et le compte rendu.
 *
 * C'est ce qu'il fait dans les minutes qui suivent, dans la voiture ou
 * entre deux rendez-vous. Le reste de la fiche (matrices, transcript,
 * analyses détaillées) se lit sur le site.
 *
 * Le mail et le compte rendu valent `null` tant qu'ils ne sont pas écrits :
 * le téléphone propose alors de les écrire.
 */
export type MobileDebrief = {
  salesScore: number | null;
  /** Au plus trois, dans l'ordre de la fiche : l'information, la phrase, le geste. */
  challenges: MeetingChallenge[];
  /** La synthèse du coaching, en quelques phrases. */
  coachingSummary: string | null;
  followUpEmail: { subject: string; body: string } | null;
  visitReport: string | null;
};

type DebriefSource = {
  followUpEmailDraft: string | null;
  visitReportDraft: string | null;
  analyses: ReadonlyArray<{ kind: string; result: unknown; createdAt: Date }>;
};

/** La dernière analyse d'un type : une relance en ajoute une nouvelle sans effacer l'ancienne. */
function latest(source: DebriefSource, kind: string): unknown {
  let found: { result: unknown; createdAt: Date } | null = null;
  for (const a of source.analyses) {
    if (a.kind !== kind) continue;
    if (!found || a.createdAt > found.createdAt) found = a;
  }
  return found?.result ?? null;
}

export function mobileDebrief(source: DebriefSource): MobileDebrief {
  const kiss = kissResultSchema.safeParse(latest(source, "KISS"));
  const email = parseFollowUpEmailDraft(source.followUpEmailDraft);
  const report = source.visitReportDraft?.trim() ?? "";

  return {
    salesScore: salesScoreForMeeting({
      scorecardResult: latest(source, "SCORECARD"),
    }),
    challenges: kiss.success ? challengesForDisplay(kiss.data) : [],
    coachingSummary: kiss.success ? kiss.data.summary.trim() || null : null,
    followUpEmail: email.body.trim()
      ? { subject: email.subject, body: email.body }
      : null,
    visitReport: report || null,
  };
}
