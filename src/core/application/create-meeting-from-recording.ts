import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import { createMeetingForOrg } from "@/src/core/application/create-meeting";
import { prefillMeetingFromTranscript } from "@/src/core/application/prefill-meeting-from-transcript";
import {
  transcribeMeetingAudio,
  type AudioFetcher,
  type TranscribeMeetingAudioError,
} from "@/src/core/application/transcribe-meeting-audio";

type CreateMeetingDeps = Parameters<typeof createMeetingForOrg>[0];

export type CreateMeetingFromRecordingDeps = CreateMeetingDeps & {
  meetings: CreateMeetingDeps["meetings"] &
    Pick<MeetingRepositoryPort, "findMeetingIdBySourceBlobUrlForOrg">;
  analysis: AnalysisPort;
  fetchAudio: AudioFetcher;
  /** Faux quand la passerelle IA n'est pas configurée pour préremplir la fiche. */
  prefillWithModel: boolean;
};

export type CreateMeetingFromRecordingInput = {
  organizationId: string;
  sellerInternalUserId: string;
  visibleTo?: string;
  audioBlobUrl: string;
  audioMediaType: string;
  prospectName: string;
  meetingAt: Date;
  durationMin: number | null;
  /** Choisi par le commercial à la fin de l'enregistrement, sinon lu dans la conversation. */
  outcome: MeetingOutcome | null;
  notes: string | null;
  meetingTypeOptions: readonly string[];
};

export type CreateMeetingFromRecordingResult =
  | { ok: true; meetingId: string; alreadyCreated: boolean }
  | {
      ok: false;
      error:
        | TranscribeMeetingAudioError
        | "QUOTA_EXHAUSTED"
        | "INVALID_PERSON"
        | "NO_ACTIVE_ORG"
        | "NO_INTERNAL_USER";
      message?: string;
    };

/**
 * Le rendez-vous enregistré sur le téléphone d'un commercial devient une
 * fiche Sales Time, comme un enregistrement déposé depuis le navigateur.
 *
 * Le fichier est déjà dans le stockage de l'organisation. On le transcrit,
 * on lit dans la conversation ce que le commercial n'a pas eu le temps de
 * saisir (type de rendez-vous, issue, montant), puis la fiche est créée et
 * son analyse mise en file.
 *
 * Le même fichier renvoyé une seconde fois rend la fiche déjà créée : une
 * réponse perdue sur un réseau mobile ne doit ni doubler le rendez-vous, ni
 * coûter une seconde transcription.
 *
 * Le quota est vérifié avant la transcription, qui est l'étape la plus
 * longue et la plus chère.
 */
export async function createMeetingFromRecording(
  deps: CreateMeetingFromRecordingDeps,
  input: CreateMeetingFromRecordingInput,
): Promise<CreateMeetingFromRecordingResult> {
  const existing = await deps.meetings.findMeetingIdBySourceBlobUrlForOrg({
    organizationId: input.organizationId,
    sourceBlobUrl: input.audioBlobUrl,
  });
  if (existing) {
    return { ok: true, meetingId: existing, alreadyCreated: true };
  }

  const quota = deps.organizationQuota;
  if (
    !(await quota.isPlanUnlocked(input.organizationId)) &&
    (await quota.getTrialAnalysesLeft(input.organizationId)) <= 0
  ) {
    return { ok: false, error: "QUOTA_EXHAUSTED" };
  }

  const transcribed = await transcribeMeetingAudio(
    { analysis: deps.analysis, fetchAudio: deps.fetchAudio },
    {
      organizationId: input.organizationId,
      blobUrl: input.audioBlobUrl,
      mediaType: input.audioMediaType,
    },
  );
  if (!transcribed.ok) {
    return {
      ok: false,
      error: transcribed.error,
      ...(transcribed.message ? { message: transcribed.message } : {}),
    };
  }

  const prefill = await prefillMeetingFromTranscript(
    { analysis: deps.analysis, useModel: deps.prefillWithModel },
    {
      transcript: transcribed.transcript,
      meetingTypeOptions: input.meetingTypeOptions,
    },
  );

  const created = await createMeetingForOrg(deps, {
    organizationId: input.organizationId,
    sellerInternalUserId: input.sellerInternalUserId,
    visibleTo: input.visibleTo,
    personId: null,
    prospectName: input.prospectName,
    meetingAt: input.meetingAt,
    durationMin: input.durationMin,
    meetingType: prefill.meetingType,
    pipelineStage: null,
    potentialAmount: prefill.potentialAmount,
    transcript: transcribed.transcript,
    notes: input.notes,
    outcome: input.outcome ?? prefill.outcome ?? "OTHER",
    feeling: null,
    sourceType: "UPLOAD",
    sourceBlobUrl: input.audioBlobUrl,
  });
  if (!created.ok) return { ok: false, error: created.error };

  return { ok: true, meetingId: created.meetingId, alreadyCreated: false };
}
