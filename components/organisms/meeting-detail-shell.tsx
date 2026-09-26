import { KissResultView } from "@/components/molecules/kiss-result-view";
import { MeetingAnalysisProgressCard } from "@/components/molecules/meeting-analysis-progress-card";
import { MeetingAnalysisStatusPoller } from "@/components/molecules/meeting-analysis-status-poller";
import { MeetingAnalysisRecoverySection } from "@/components/organisms/meeting-analysis-recovery-section";
import { ContentCard } from "@/components/molecules/content-card";
import { InfoCard } from "@/components/molecules/info-card";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { MeetingDetailHeader } from "@/components/organisms/meeting-detail-header";
import { MeetingEditButton } from "@/components/organisms/meeting-edit-trigger";
import { MeetingInterlocutorSection } from "@/components/organisms/meeting-interlocutor-section";
import { MeetingSynthesisSection } from "@/components/organisms/meeting-synthesis-section";
import { MeetingTranscriptPreview } from "@/components/molecules/meeting-transcript-preview";
import { ScorecardResultSection } from "@/components/organisms/scorecard-result-section";
import { sectionHeadingClass } from "@/lib/page-typography";
import type { MeetingAnalysisProgress } from "@/src/core/domain/meeting-analysis-progress";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { ScorecardAnalysisResult } from "@/src/core/domain/scorecard-result-zod";

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
  /** Les étapes de l'analyse automatique et leur état, pour la carte d'avancement. */
  analysisProgress: MeetingAnalysisProgress;
  meetingSynthesis: string;
  synthesisFromAi: boolean;
  interlocutorProfile: string;
  soncasResult: SoncasAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  kissResult: KissAnalysisResult | null;
  /** Absente tant que le type de rendez-vous n'a pas de grille. */
  scorecardResult: ScorecardAnalysisResult | null;
  /**
   * Une seule autorisation pour les deux blocs qui notent le commercial.
   *
   * La scorecard dit ce que KISS dit, en plus détaillé. Deux réglages
   * séparés finiraient par diverger, et le jour où l'un serait ouvert sans
   * l'autre, la note serait cachée pendant que son détail resterait lisible.
   */
  showSellerCoaching: boolean;
  canEdit?: boolean;
  processingLooksSlow?: boolean;
  processingLooksStuck?: boolean;
};

export function MeetingDetailShell({
  meeting,
  tamMinutesPerRdv,
  salesScore,
  salesScoreDelta,
  analysisProgress,
  meetingSynthesis,
  synthesisFromAi,
  interlocutorProfile,
  soncasResult,
  discResult,
  kissResult,
  scorecardResult,
  showSellerCoaching,
  canEdit = false,
  processingLooksSlow = false,
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
        salesScorePending={meeting.status === "PROCESSING"}
        followUpEmailDraft={meeting.followUpEmailDraft}
      />

      <MeetingAnalysisProgressCard
        status={meeting.status}
        progress={analysisProgress}
      />
      <MeetingAnalysisStatusPoller status={meeting.status} />

      {meeting.status === "FAILED" && meeting.errorMessage ? (
        <InfoCard
          title="Échec de l'analyse"
          description={meeting.errorMessage}
          className="border-destructive/50 bg-destructive/5"
        />
      ) : null}

      {canEdit && processingLooksStuck ? (
        <InfoCard
          title="Analyse bloquée"
          description="L'analyse semble bloquée depuis plus de 15 minutes. Relancez l'analyse, rechargez la page, ou attendez la réconciliation quotidienne automatique."
        />
      ) : null}

      {canEdit &&
      ((meeting.status === "PROCESSING" &&
        (processingLooksSlow || processingLooksStuck)) ||
        meeting.status === "FAILED") ? (
        <MeetingAnalysisRecoverySection meetingId={meeting.id} />
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

      {/*
        La scorecard passe avant le coaching KISS : elle note ce qui s'est
        passé, KISS dit quoi en faire. Lire le conseil avant la note obligerait
        à remonter pour savoir de quoi il parle.
      */}
      {scorecardResult ? (
        showSellerCoaching ? (
          <ScorecardResultSection result={scorecardResult} />
        ) : (
          <InfoCard
            title="Scorecard du rendez-vous"
            description="La scorecard note la conduite du rendez-vous. Elle est visible par le commercial assigné et les managers de l'organisation."
          />
        )
      ) : null}

      {kissResult ? (
        showSellerCoaching ? (
          <section className="space-y-3">
            <h2 className={sectionHeadingClass}>Coaching KISS</h2>
            <KissResultView result={kissResult} />
          </section>
        ) : (
          <InfoCard
            title="Coaching KISS"
            description="Le coaching KISS (Keep / Improve / Stop / Start) est visible par le commercial assigné à ce rendez-vous et les managers de l'organisation."
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
