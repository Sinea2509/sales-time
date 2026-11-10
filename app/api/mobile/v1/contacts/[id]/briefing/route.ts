import { z } from "zod";
import { checkAiGatewayConfigured } from "@/lib/env";
import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";
import { prepareMeetingBriefing } from "@/src/core/application/prepare-meeting-briefing";
import { contactsVisibleTo } from "@/src/core/domain/contact-visibility";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({
  targetStage: z.string().trim().min(1).max(120),
});

/**
 * La préparation d'un rendez-vous avec un contact déjà rencontré : ce que les
 * rendez-vous précédents ont appris, l'objectif, la question à poser et les
 * objections probables. La même que la page « Préparer un RDV » du site.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!z.string().cuid().safeParse(id).success) {
    return mobileError("VALIDATION");
  }
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError("VALIDATION");
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return mobileError("VALIDATION");

  const ai = checkAiGatewayConfigured();
  if (!ai.ok) return mobileError(ai.error);

  try {
    const result = await prepareMeetingBriefing(actor.deps, {
      organizationId: actor.organizationId,
      personId: id,
      targetStage: parsed.data.targetStage,
      visibleTo: contactsVisibleTo(actor),
    });
    if (!result) return mobileError("NOT_FOUND");

    const b = result.briefing;
    return mobileJson({
      personName: result.person.displayName,
      hasHistory: result.hasHistory,
      briefing: {
        lastMeetingSummary: b.lastMeetingSummary,
        meetingGoal: b.meetingGoal,
        goldenQuestion: b.goldenQuestion,
        goldenQuestionWhy: b.goldenQuestionWhy,
        howToTalk: b.howToTalk,
        likelyObjections: b.likelyObjections,
        openPoints: b.openPoints,
      },
      challenges: result.challenges,
    });
  } catch {
    return mobileError("FAILED");
  }
}
