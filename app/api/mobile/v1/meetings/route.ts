import { revalidatePath } from "next/cache";
import { z } from "zod";
import { scheduleAnalysisJobsAfterResponse } from "@/app/[locale]/company/rendez-vous/schedule-analysis-jobs";
import { fetchOrgBlobBytes } from "@/lib/blob-access";
import { blobUrlBelongsToOrg } from "@/lib/blob-paths";
import { checkAiGatewayConfigured } from "@/lib/env";
import { toMobileMeeting } from "@/lib/mobile/mobile-meeting";
import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";
import { revalidateTeamMemberPerformancePaths } from "@/lib/revalidate-team-member-paths";
import { createMeetingFromRecording } from "@/src/core/application/create-meeting-from-recording";
import { contactsVisibleTo } from "@/src/core/domain/contact-visibility";
import { MEETING_OUTCOMES } from "@/src/core/domain/meeting-outcome";

export const dynamic = "force-dynamic";
/* Une heure d'audio se transcrit en une à deux minutes ; on laisse de la marge. */
export const maxDuration = 300;

const createSchema = z.object({
  audioBlobUrl: z.string().trim().url().max(2000),
  audioMediaType: z.string().trim().min(1).max(80),
  prospectName: z.string().trim().min(1).max(200),
  meetingAt: z.coerce.date(),
  /* Mesurée par le téléphone, pauses déduites. */
  durationSec: z
    .number()
    .int()
    .min(0)
    .max(12 * 3600),
  outcome: z.enum(MEETING_OUTCOMES).nullable().optional(),
  notes: z
    .string()
    .trim()
    .max(10_000)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
});

/** Les rendez-vous récents du commercial connecté, pour suivre leur analyse. */
export async function GET(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  const rows = await actor.deps.meetings.listRecentMeetingsForDashboard({
    organizationId: actor.organizationId,
    sellerUserId: actor.actorUserId,
    limit: 30,
  });
  return mobileJson({ meetings: rows.map(toMobileMeeting) });
}

/**
 * Un enregistrement déjà déposé dans le stockage devient une fiche de
 * rendez-vous. La réponse arrive une fois la transcription faite ; l'analyse
 * se poursuit ensuite, et le téléphone suit son état par `GET /meetings/:id`.
 */
export async function POST(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError("VALIDATION");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return mobileError("VALIDATION");
  const data = parsed.data;

  if (!blobUrlBelongsToOrg(data.audioBlobUrl, actor.organizationId)) {
    return mobileError("VALIDATION");
  }
  const ai = checkAiGatewayConfigured();
  if (!ai.ok) return mobileError(ai.error);

  const settings = await actor.deps.organizationSettings.findByOrganizationId(
    actor.organizationId,
  );
  const { meetingTypeOptions } = orgMeetingFormOptionsFromSettings(settings);

  const result = await createMeetingFromRecording(
    {
      ...actor.deps,
      fetchAudio: fetchOrgBlobBytes,
      prefillWithModel: true,
    },
    {
      organizationId: actor.organizationId,
      sellerInternalUserId: actor.actorUserId,
      visibleTo: contactsVisibleTo(actor),
      audioBlobUrl: data.audioBlobUrl,
      audioMediaType: data.audioMediaType,
      prospectName: data.prospectName,
      meetingAt: data.meetingAt,
      durationMin: Math.max(1, Math.round(data.durationSec / 60)),
      outcome: data.outcome ?? null,
      notes: data.notes,
      meetingTypeOptions,
    },
  );
  if (!result.ok) return mobileError(result.error);

  if (!result.alreadyCreated) {
    scheduleAnalysisJobsAfterResponse();
    revalidatePath("/company/rendez-vous");
    revalidatePath("/company/analyse");
    revalidatePath("/company");
    revalidateTeamMemberPerformancePaths(actor.actorUserId);
  }

  return mobileJson(
    { meetingId: result.meetingId, alreadyCreated: result.alreadyCreated },
    result.alreadyCreated ? 200 : 201,
  );
}
