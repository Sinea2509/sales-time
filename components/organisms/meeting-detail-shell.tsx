import { KissResultView } from "@/components/molecules/kiss-result-view";
import { MeetingAnalysisStatusBanner } from "@/components/molecules/meeting-analysis-status-banner";
import { ContentCard } from "@/components/molecules/content-card";
import { InfoCard } from "@/components/molecules/info-card";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { MeetingDetailHeader } from "@/components/organisms/meeting-detail-header";
import { MeetingEditButton } from "@/components/organisms/meeting-edit-trigger";
import { MeetingInterlocutorSection } from "@/components/organisms/meeting-interlocutor-section";
import { MeetingSynthesisSection } from "@/components/organisms/meeting-synthesis-section";
import { MeetingTranscriptPreview } from "@/components/molecules/meeting-transcript-preview";
import { Badge } from "@/components/ui/badge";
import {
  meetingStatusBadgeClass,
  meetingStatusLabel,
} from "@/lib/meeting-status-label";
import { sectionHeadingClass } from "@/lib/page-typography";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";

export type MeetingDetailShellProps = {
  meeting: {
    id: string;
    prospectName: string;
    prospectCompany: string | null;
    status: MeetingStatus;
    feeling: number | null;
    meetingAt: Date;
    outcome: string;
    meetingType: string | null;
    pipelineStage: string | null;
    potentialAmount: number | null;
    transcript: string;
    notes: string | null;
    followUpEmailDraft: string | null;
    errorMessage: string | null;
  };
  tamMinutesPerRdv: number;
  salesScore: number | null;
  salesScoreDelta: number | null;
  meetingSynthesis: string;
  synthesisFromAi: boolean;
  interlocutorProfile: string;
  soncasResult: SoncasAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  kissResult: KissAnalysisResult | null;
  showKissCoaching: boolean;
  canEdit?: boolean;
  processingLooksStuck?: boolean;
};

export function MeetingDetailShell({
  meeting,
  tamMinutesPerRdv,
  salesScore,
  salesScoreDelta,
  meetingSynthesis,
  synthesisFromAi,
  interlocutorProfile,
  soncasResult,
  discResult,
  kissResult,
  showKissCoaching,
  canEdit = false,
  processingLooksStuck = false,
}: MeetingDetailShellProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <NavLinkButton href="/company/rendez-vous" variant="ghost" size="sm">
          Retour
        </NavLinkButton>
        {canEdit ? (
          <MeetingEditButton
            meetingId={meeting.id}
            prospectName={meeting.prospectName}
          />
        ) : null}
      </div>

      <MeetingDetailHeader
        meetingId={meeting.id}
        prospectName={meeting.prospectName}
        prospectCompany={meeting.prospectCompany}
        meetingAt={meeting.meetingAt}
        meetingType={meeting.meetingType}
        pipelineStage={meeting.pipelineStage}
        potentialAmount={meeting.potentialAmount}
        tamMinutesPerRdv={tamMinutesPerRdv}
        salesScore={salesScore}
        salesScoreDelta={salesScoreDelta}
        followUpEmailDraft={meeting.followUpEmailDraft}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={meetingStatusBadgeClass(meeting.status)}>
          {meetingStatusLabel(meeting.status)}
        </Badge>
        {meeting.feeling != null ? (
          <Badge variant="outline">Ressenti {meeting.feeling}/5</Badge>
        ) : null}
        <span className="text-muted-foreground text-sm">
          {new Date(meeting.meetingAt).toLocaleString("fr-FR")} ·{" "}
          {meeting.outcome}
          {meeting.meetingType ? ` · ${meeting.meetingType}` : ""}
        </span>
      </div>

      <MeetingAnalysisStatusBanner status={meeting.status} />

      {meeting.status === "FAILED" && meeting.errorMessage ? (
        <InfoCard
          title="Échec de l'analyse"
          description={meeting.errorMessage}
          className="border-destructive/50 bg-destructive/5"
        />
      ) : null}

      {processingLooksStuck ? (
        <InfoCard
          title="Analyse bloquée"
          description="L'analyse semble bloquée depuis plus de 15 minutes. Rechargez la page ou modifiez le rendez-vous pour relancer l'analyse automatique. Vérifiez aussi que AI_GATEWAY_API_KEY est configuré (voir docs/env-sync.md)."
        />
      ) : null}

      <MeetingSynthesisSection
        meetingSynthesis={meetingSynthesis}
        fromAi={synthesisFromAi}
      />

      <MeetingInterlocutorSection
        prospectName={meeting.prospectName}
        prospectCompany={meeting.prospectCompany}
        interlocutorProfile={interlocutorProfile}
        discResult={discResult}
        soncasResult={soncasResult}
        analysisPending={meeting.status === "PROCESSING"}
      />

      {kissResult ? (
        showKissCoaching ? (
          <section className="space-y-3">
            <h2 className={sectionHeadingClass}>Coaching KISS</h2>
            <KissResultView result={kissResult} showCoachingScore />
          </section>
        ) : (
          <InfoCard
            title="Coaching KISS"
            description="Le détail KISS et le score de coaching sont visibles par le commercial assigné à ce rendez-vous et les managers de l'organisation."
          />
        )
      ) : null}

      <ContentCard title="Transcript">
        <MeetingTranscriptPreview transcript={meeting.transcript} />
      </ContentCard>

      {meeting.notes ? (
        <ContentCard title="Notes">
          <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
        </ContentCard>
      ) : null}
    </div>
  );
}
