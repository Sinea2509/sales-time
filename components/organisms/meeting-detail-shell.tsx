import { DiscResultView } from "@/components/molecules/disc-result-view";
import { KissResultView } from "@/components/molecules/kiss-result-view";
import { SoncasResultView } from "@/components/molecules/soncas-result-view";
import { ContentCard } from "@/components/molecules/content-card";
import { InfoCard } from "@/components/molecules/info-card";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { MeetingAnalysisButtons } from "@/components/organisms/meeting-analysis-buttons";
import { MeetingFollowUpEmailBlock } from "@/components/organisms/meeting-follow-up-email";
import { MeetingOneClickAnalyze } from "@/components/organisms/meeting-one-click-analyze";
import { Badge } from "@/components/ui/badge";
import { meetingStatusBadgeClass,
  meetingStatusLabel,
} from "@/lib/meeting-status-label";
import { pageTitleClass } from "@/lib/page-typography";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";

type MeetingAnalysisSummary = {
  kind: string;
  model: string;
};

export type MeetingDetailShellProps = {
  meeting: {
    id: string;
    prospectName: string;
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
  };
  analyses: MeetingAnalysisSummary[];
  soncasResult: SoncasAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  kissResult: KissAnalysisResult | null;
  showKissCoaching: boolean;
};

export function MeetingDetailShell({
  meeting,
  analyses,
  soncasResult,
  discResult,
  kissResult,
  showKissCoaching,
}: MeetingDetailShellProps) {
  const soncas = analyses.find((a) => a.kind === "SONCAS");
  const disc = analyses.find((a) => a.kind === "DISC");
  const kiss = analyses.find((a) => a.kind === "KISS");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Fiche RDV
          </p>
          <h1 className={pageTitleClass}>{meeting.prospectName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={meetingStatusBadgeClass(meeting.status)}>
              {meetingStatusLabel(meeting.status)}
            </Badge>
            {meeting.feeling != null ? (
              <Badge variant="outline">Ressenti {meeting.feeling}/5</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date(meeting.meetingAt).toLocaleString()} · {meeting.outcome}
            {meeting.meetingType ? ` · ${meeting.meetingType}` : ""}
            {meeting.pipelineStage ? ` · ${meeting.pipelineStage}` : ""}
            {meeting.potentialAmount != null
              ? ` · ${new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(meeting.potentialAmount)}`
              : ""}
          </p>
        </div>
        <NavLinkButton href="/company/rendez-vous" variant="ghost" size="sm">
          Retour
        </NavLinkButton>
      </div>

      <ContentCard
        title="Analyse IA"
        description={
          <>
            Vercel AI Gateway — modèle configuré côté serveur. Nécessite{" "}
            <code className="text-xs">AI_GATEWAY_API_KEY</code>.
          </>
        }
      >
        <div className="space-y-4">
          <MeetingOneClickAnalyze meetingId={meeting.id} />
          <div className="flex flex-wrap gap-2">
            {soncas ? (
              <Badge variant="secondary">SONCAS (v{soncas.model})</Badge>
            ) : (
              <Badge variant="outline">SONCAS — non lancé</Badge>
            )}
            {disc ? (
              <Badge variant="secondary">DISC (v{disc.model})</Badge>
            ) : (
              <Badge variant="outline">DISC — non lancé</Badge>
            )}
            {kiss ? (
              <Badge variant="secondary">KISS (v{kiss.model})</Badge>
            ) : (
              <Badge variant="outline">KISS — non lancé</Badge>
            )}
          </div>
          <MeetingAnalysisButtons meetingId={meeting.id} />
        </div>
      </ContentCard>

      {soncasResult ? <SoncasResultView result={soncasResult} /> : null}
      {discResult ? <DiscResultView result={discResult} /> : null}
      {kissResult ? (
        showKissCoaching ? (
          <KissResultView result={kissResult} showCoachingScore />
        ) : (
          <InfoCard
            title="Coaching KISS"
            description="Le détail KISS et le score de coaching sont visibles uniquement par le commercial assigné à ce rendez-vous."
          />
        )
      ) : null}

      <ContentCard
        title="Mail de suivi client"
        description="Généré à partir du transcript et des analyses — à relire avant envoi."
      >
        <MeetingFollowUpEmailBlock
          meetingId={meeting.id}
          initialDraft={meeting.followUpEmailDraft}
        />
      </ContentCard>

      <ContentCard title="Transcript">
        <pre className="bg-muted max-h-[320px] overflow-auto rounded-lg p-4 text-xs whitespace-pre-wrap">
          {meeting.transcript}
        </pre>
      </ContentCard>

      {meeting.notes ? (
        <ContentCard title="Notes">
          <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
        </ContentCard>
      ) : null}
    </div>
  );
}
