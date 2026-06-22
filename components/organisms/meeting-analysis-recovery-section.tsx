import { MeetingAnalysisRetryButton } from "@/components/organisms/meeting-analysis-retry-button";
import { MeetingOneClickAnalyze } from "@/components/organisms/meeting-one-click-analyze";

export function MeetingAnalysisRecoverySection({
  meetingId,
}: {
  meetingId: string;
}) {
  return (
    <section className="space-y-3">
      <MeetingAnalysisRetryButton meetingId={meetingId} />
      <MeetingOneClickAnalyze meetingId={meetingId} />
    </section>
  );
}
