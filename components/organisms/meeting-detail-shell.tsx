import { ToneChip } from "@/components/atoms/tone-chip";
import { InfoCard } from "@/components/molecules/info-card";
import { MeetingAnalysisProgressCard } from "@/components/molecules/meeting-analysis-progress-card";
import { MeetingAnalysisStatusPoller } from "@/components/molecules/meeting-analysis-status-poller";
import { Card, CardContent } from "@/components/ui/card";
import { MeetingAnalysisRecoverySection } from "@/components/organisms/meeting-analysis-recovery-section";
import {
  MeetingDetailHeader,
  type MeetingDetailHeaderProps,
} from "@/components/organisms/meeting-detail-header";
import {
  MeetingDetailRail,
  type MeetingDetailRailProps,
} from "@/components/organisms/meeting-detail-rail";
import {
  MeetingDetailTabs,
  type MeetingDetailTab,
} from "@/components/organisms/meeting-detail-tabs";
import { MeetingDiscTab } from "@/components/organisms/meeting-disc-tab";
import { MeetingEditButton } from "@/components/organisms/meeting-edit-trigger";
import { MeetingEmailTab } from "@/components/organisms/meeting-email-tab";
import { MeetingKissTab } from "@/components/organisms/meeting-kiss-tab";
import { MeetingObjectionsTab } from "@/components/organisms/meeting-objections-tab";
import { MeetingSoncasTab } from "@/components/organisms/meeting-soncas-tab";
import { MeetingSynthesisSection } from "@/components/organisms/meeting-synthesis-section";
import { MeetingTranscriptTab } from "@/components/organisms/meeting-transcript-tab";
import { ScorecardResultSection } from "@/components/organisms/scorecard-result-section";
import { cardTitleClass } from "@/lib/page-typography";
import type { MeetingAnalysisProgress } from "@/src/core/domain/meeting-analysis-progress";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { ScorecardAnalysisResult } from "@/src/core/domain/scorecard-result-zod";
import type { ObjectionsAnalysisResult } from "@/src/core/domain/objections-result-zod";

export type MeetingDetailShellProps = {
  meeting: {
    id: string;
    prospectName: string;
    status: MeetingStatus;
    transcript: string;
    notes: string | null;
    followUpEmailDraft: string | null;
    errorMessage: string | null;
    meetingType: string | null;
    pipelineStage: string | null;
  };
  header: Omit<MeetingDetailHeaderProps, "status">;
  rail: MeetingDetailRailProps;
  analysisProgress: MeetingAnalysisProgress;
  meetingSynthesis: string;
  synthesisFromAi: boolean;
  /** Vrai quand le compte rendu manque et doit s'écrire au fil de l'eau. */
  streamVisitReport?: boolean;
  soncasResult: SoncasAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  kissResult: KissAnalysisResult | null;
  /** Absente tant que le type de rendez-vous n'a pas de grille. */
  scorecardResult: ScorecardAnalysisResult | null;
  scorecardGridIntent: string | null;
  scorecardGridAssumed: boolean;
  /** Absente sur un rendez-vous analysé avant que les objections ne le soient. */
  objectionsResult: ObjectionsAnalysisResult | null;
  transcriptSourceLabel: string | null;
  /**
   * Une seule autorisation pour les deux blocs qui notent le commercial : la
   * scorecard dit ce que KISS dit, en plus détaillé.
   */
  showSellerCoaching: boolean;
  canEdit?: boolean;
  processingLooksSlow?: boolean;
  processingLooksStuck?: boolean;
};

function CoachingReserved({ what }: { what: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className={cardTitleClass}>{what}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Cette lecture note le commercial. Elle est visible par le commercial
          assigné à ce rendez-vous et par les managers de l&apos;organisation.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * La fiche d'un rendez-vous, comme la maquette du 11 septembre la dessine :
 * le compte rendu prêt à coller ouvre la page, tout le reste est le détail
 * qui l'explique, en sept onglets. La colonne de droite porte ce qui se
 * décide : le score, la parole, le plan d'action, la provenance.
 */
export function MeetingDetailShell({
  meeting,
  header,
  rail,
  analysisProgress,
  meetingSynthesis,
  synthesisFromAi,
  streamVisitReport = false,
  soncasResult,
  discResult,
  kissResult,
  scorecardResult,
  scorecardGridIntent,
  scorecardGridAssumed,
  objectionsResult,
  transcriptSourceLabel,
  showSellerCoaching,
  canEdit = false,
  processingLooksSlow = false,
  processingLooksStuck = false,
}: MeetingDetailShellProps) {
  const pending = meeting.status === "PROCESSING";

  const tabs: MeetingDetailTab[] = [
    {
      id: "grille",
      label: "Mon SalesScore",
      panel: scorecardResult ? (
        showSellerCoaching ? (
          <ScorecardResultSection
            result={scorecardResult}
            gridAssumed={scorecardGridAssumed}
            gridIntent={scorecardGridIntent}
          />
        ) : (
          <CoachingReserved what="Mon SalesScore détaillé" />
        )
      ) : (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={cardTitleClass}>Mon SalesScore détaillé</h2>
              {pending ? <ToneChip tone="info">en cours</ToneChip> : null}
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {pending
                ? "La scorecard se remplit pendant l'analyse."
                : "Ce type de rendez-vous n'a pas encore de grille de notation : seule la découverte en a une. Le SalesScore de la colonne de droite reste calculé à partir des leviers SONCAS."}
            </p>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "objections",
      label: "Objections",
      panel: (
        <MeetingObjectionsTab
          objections={objectionsResult}
          prospectName={meeting.prospectName}
          pending={pending}
        />
      ),
    },
    {
      id: "soncas",
      label: "SONCAS",
      panel: (
        <MeetingSoncasTab
          soncas={soncasResult}
          prospectName={meeting.prospectName}
          pending={pending}
        />
      ),
    },
    {
      id: "disc",
      label: "DISC",
      panel: (
        <MeetingDiscTab
          disc={discResult}
          prospectName={meeting.prospectName}
          pending={pending}
        />
      ),
    },
    {
      id: "kiss",
      label: "KISS",
      panel: showSellerCoaching ? (
        <MeetingKissTab
          kiss={kissResult}
          challenge={scorecardResult?.challenge ?? null}
          pending={pending}
        />
      ) : (
        <CoachingReserved what="Coaching KISS" />
      ),
    },
    {
      id: "email",
      label: "E-mail",
      panel: (
        <MeetingEmailTab
          meetingId={meeting.id}
          initialDraft={meeting.followUpEmailDraft}
        />
      ),
    },
    {
      id: "transcript",
      label: "Transcript",
      panel: (
        <MeetingTranscriptTab
          transcript={meeting.transcript}
          notes={meeting.notes}
          sourceLabel={transcriptSourceLabel}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MeetingDetailHeader {...header} status={meeting.status} />
        {canEdit ? (
          <MeetingEditButton
            meetingId={meeting.id}
            prospectName={meeting.prospectName}
          />
        ) : null}
      </div>

      <MeetingAnalysisProgressCard
        status={meeting.status}
        progress={analysisProgress}
      />
      <MeetingAnalysisStatusPoller status={meeting.status} />

      {meeting.status === "FAILED" && meeting.errorMessage ? (
        <InfoCard
          title="L'analyse n'a pas abouti"
          description={meeting.errorMessage}
          className="border-destructive/50 bg-destructive/5"
        />
      ) : null}

      {canEdit && processingLooksStuck ? (
        <InfoCard
          title="Analyse bloquée"
          description="L'analyse semble bloquée depuis plus de 15 minutes. Relancez l'analyse, ou attendez le rattrapage automatique, toutes les cinq minutes."
        />
      ) : null}

      {canEdit &&
      ((meeting.status === "PROCESSING" &&
        (processingLooksSlow || processingLooksStuck)) ||
        meeting.status === "FAILED") ? (
        <MeetingAnalysisRecoverySection meetingId={meeting.id} />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.62fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <MeetingSynthesisSection
            meetingSynthesis={meetingSynthesis}
            fromAi={synthesisFromAi}
            streamMeetingId={streamVisitReport ? meeting.id : null}
          />
          <MeetingDetailTabs tabs={tabs} />
        </div>
        <MeetingDetailRail {...rail} />
      </div>
    </div>
  );
}
