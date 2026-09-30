import {
  pipelineInProgress,
  type PipelineInProgress,
} from "./pipeline-in-progress";
import { salesScoreSeries } from "./sales-score-series";
import { salesProfileScoresFromMeeting } from "./sales-profile-from-meetings";
import { scorecardResultSchema } from "./scorecard-result-zod";
import {
  sellerMonthlyAxis,
  type SellerMonthlyAxis,
} from "./scorecard-team-axes";
import { averageSkillScores } from "./seller-skill-signature";
import { sellerTopSkills, type SellerTopSkill } from "./seller-top-skills";
import type { MeetingOutcome } from "./meeting-outcome";

/** Ce que ce calcul lit d'un rendez-vous du commercial. */
export type SellerFocusMeeting = {
  id: string;
  personId: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: Date;
  outcome: MeetingOutcome;
  potentialAmount: number | null;
  salesScore: number | null;
  latestScorecardResult?: unknown | null;
  latestKissResult?: unknown | null;
};

export type SellerWeeklyChallenge = {
  text: string;
  meetingId: string;
  /** « Groupe Vermont », ou le nom du prospect à défaut de société. */
  from: string;
};

export type SellerDashboardFocus = {
  /** Le défi du dernier rendez-vous noté : ce que la maquette appelle le défi de la semaine. */
  challenge: SellerWeeklyChallenge | null;
  axis: SellerMonthlyAxis | null;
  strengths: { skills: SellerTopSkill[]; meetings: number };
  pipeline: PipelineInProgress;
  scoreSeries: number[];
};

/**
 * Ce que le tableau de bord d'un commercial dit au-delà des compteurs : le
 * défi repris de son dernier rendez-vous, son axe d'amélioration du mois, ses
 * points forts, et ce que valent ses affaires ouvertes.
 *
 * Tout vient des analyses déjà enregistrées sur ses rendez-vous de la période.
 * Aucun appel au modèle : ces cartes doivent s'ouvrir aussi vite que les
 * chiffres qu'elles accompagnent.
 */
export function sellerDashboardFocus(
  meetings: readonly SellerFocusMeeting[],
): SellerDashboardFocus {
  const byDateDesc = [...meetings].sort(
    (a, b) => b.meetingAt.getTime() - a.meetingAt.getTime(),
  );

  let challenge: SellerWeeklyChallenge | null = null;
  for (const m of byDateDesc) {
    const parsed = scorecardResultSchema.safeParse(m.latestScorecardResult);
    if (parsed.success && parsed.data.challenge.trim()) {
      challenge = {
        text: parsed.data.challenge.trim(),
        meetingId: m.id,
        from: m.prospectCompany?.trim() || m.prospectName,
      };
      break;
    }
  }

  const skillNotes = meetings.flatMap((m) => {
    const s = salesProfileScoresFromMeeting(m);
    return s ? [s] : [];
  });

  return {
    challenge,
    axis: sellerMonthlyAxis(
      meetings.map((m) => ({
        meetingId: m.id,
        result: m.latestScorecardResult,
      })),
    ),
    strengths: {
      skills: sellerTopSkills(averageSkillScores(skillNotes)),
      meetings: skillNotes.length,
    },
    pipeline: pipelineInProgress(meetings),
    scoreSeries: salesScoreSeries(meetings),
  };
}
