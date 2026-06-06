import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import type { SellerCommercialMeetingDigestForSummary } from "@/src/core/ports/analysis-port";

const MAX_MEETINGS_FOR_AI = 16;
const MAX_TRANSCRIPT_CHARS = 2400;

export function buildMeetingDigestsForAiSummary(
  meetings: RecentMeetingListRow[],
): SellerCommercialMeetingDigestForSummary[] {
  const sorted = [...meetings].sort(
    (a, b) => b.meetingAt.getTime() - a.meetingAt.getTime(),
  );
  return sorted.slice(0, MAX_MEETINGS_FOR_AI).map((m) => ({
    prospectName: m.prospectName,
    meetingAt: m.meetingAt.toISOString(),
    meetingType: m.meetingType,
    transcriptExcerpt:
      m.transcript.length > MAX_TRANSCRIPT_CHARS
        ? `${m.transcript.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[…]`
        : m.transcript,
    soncasResult: m.latestSoncasResult ?? undefined,
    discResult: m.latestDiscResult ?? undefined,
    kissResult: m.latestKissResult ?? undefined,
  }));
}
