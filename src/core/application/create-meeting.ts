import type { AuditRepositoryPort } from "@/src/core/ports/audit-repository-port";
import type { AnalysisJobRepositoryPort } from "@/src/core/ports/analysis-job-repository-port";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationQuotaRepositoryPort } from "@/src/core/ports/organization-quota-repository-port";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { MeetingSourceType } from "@/src/core/domain/meeting-status";
import { resolveMeetingPersonLink } from "@/src/core/application/resolve-meeting-person-link";

export type CreateMeetingResult =
  | { ok: true; meetingId: string }
  | {
      ok: false;
      error:
        | "NO_ACTIVE_ORG"
        | "NO_INTERNAL_USER"
        | "INVALID_PERSON"
        | "QUOTA_EXHAUSTED";
    };

export async function createMeetingForOrg(
  deps: {
    meetings: MeetingRepositoryPort;
    contacts: ContactRepositoryPort;
    analysisJobs: AnalysisJobRepositoryPort;
    organizationQuota: OrganizationQuotaRepositoryPort;
    audit?: AuditRepositoryPort;
  },
  input: {
    organizationId: string | null;
    sellerInternalUserId: string | null;
    personId?: string | null;
    prospectName: string;
    meetingAt: Date;
    durationMin: number | null;
    meetingType: string | null;
    pipelineStage: string | null;
    potentialAmount: number | null;
    transcript: string;
    notes: string | null;
    outcome: MeetingOutcome;
    feeling?: number | null;
    sourceType?: MeetingSourceType;
    sourceBlobUrl?: string | null;
    enqueueAnalysis?: boolean;
  },
): Promise<CreateMeetingResult> {
  if (!input.organizationId) {
    return { ok: false, error: "NO_ACTIVE_ORG" };
  }
  if (!input.sellerInternalUserId) {
    return { ok: false, error: "NO_INTERNAL_USER" };
  }

  if (input.enqueueAnalysis !== false) {
    const left = await deps.organizationQuota.getTrialAnalysesLeft(
      input.organizationId,
    );
    if (left <= 0) {
      return { ok: false, error: "QUOTA_EXHAUSTED" };
    }
  }

  const explicitPersonId =
    input.personId != null && String(input.personId).trim() !== ""
      ? String(input.personId).trim()
      : null;

  if (explicitPersonId) {
    const person = await deps.contacts.findById({
      id: explicitPersonId,
      organizationId: input.organizationId,
    });
    if (!person) {
      return { ok: false, error: "INVALID_PERSON" };
    }
  }

  const resolvedPerson = await resolveMeetingPersonLink(deps.contacts, {
    organizationId: input.organizationId,
    personId: explicitPersonId,
    prospectName: input.prospectName,
  });

  if (resolvedPerson.personId && resolvedPerson.personId !== explicitPersonId) {
    const person = await deps.contacts.findById({
      id: resolvedPerson.personId,
      organizationId: input.organizationId,
    });
    if (!person) {
      return { ok: false, error: "INVALID_PERSON" };
    }
  }

  const meeting = await deps.meetings.createMeeting({
    organizationId: input.organizationId,
    sellerUserId: input.sellerInternalUserId,
    personId: resolvedPerson.personId,
    prospectName: resolvedPerson.prospectName,
    meetingAt: input.meetingAt,
    durationMin: input.durationMin,
    meetingType: input.meetingType,
    pipelineStage: input.pipelineStage,
    potentialAmount: input.potentialAmount,
    transcript: input.transcript.trim(),
    notes: input.notes?.trim() ? input.notes.trim() : null,
    outcome: input.outcome,
    feeling: input.feeling ?? null,
    sourceType: input.sourceType ?? "TRANSCRIPT",
    sourceBlobUrl: input.sourceBlobUrl ?? null,
    status: input.enqueueAnalysis === false ? "PENDING" : "PROCESSING",
  });

  if (input.enqueueAnalysis !== false) {
    await deps.organizationQuota.decrementTrialAnalysesLeft(
      input.organizationId,
    );
    await deps.analysisJobs.enqueueMeetingAnalysis({
      organizationId: input.organizationId,
      meetingId: meeting.id,
    });
  }

  await deps.audit?.logPlatformAction({
    actorUserId: input.sellerInternalUserId,
    organizationId: input.organizationId,
    action: "CREATE_MEETING",
    reason: `RDV « ${input.prospectName.trim()} » (${meeting.id})`,
  });

  return { ok: true, meetingId: meeting.id };
}
