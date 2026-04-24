import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DiscResultView } from "@/components/molecules/disc-result-view";
import { KissResultView } from "@/components/molecules/kiss-result-view";
import { SoncasResultView } from "@/components/molecules/soncas-result-view";
import { MeetingAnalysisButtons } from "@/components/organisms/meeting-analysis-buttons";
import { MeetingFollowUpEmailBlock } from "@/components/organisms/meeting-follow-up-email";
import { MeetingOneClickAnalyze } from "@/components/organisms/meeting-one-click-analyze";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import {
  discResultSchema,
  kissResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import { makeApplicationDeps } from "@/src/adapters/composition";

export const dynamic = "force-dynamic";

export default async function RendezVousDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = makeApplicationDeps();
  const meeting = await deps.meetings.findMeetingDetailWithAnalyses({
    id,
    organizationId: actor.activeOrganizationId,
  });
  if (!meeting) notFound();

  const soncas = meeting.analyses.find((a) => a.kind === "SONCAS");
  const disc = meeting.analyses.find((a) => a.kind === "DISC");
  const kiss = meeting.analyses.find((a) => a.kind === "KISS");
  const soncasParsed = soncas
    ? soncasResultSchema.safeParse(soncas.result)
    : null;
  const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;
  const kissParsed = kiss ? kissResultSchema.safeParse(kiss.result) : null;

  const isSeller =
    actor.internalUserId != null &&
    meeting.sellerUserId === actor.internalUserId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Fiche RDV
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meeting.prospectName}
          </h1>
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
        <Link
          href="/company/rendez-vous"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Retour
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analyse IA</CardTitle>
          <CardDescription>
            Vercel AI Gateway — modèle configuré côté serveur. Nécessite{" "}
            <code className="text-xs">AI_GATEWAY_API_KEY</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {soncasParsed?.success ? <SoncasResultView result={soncasParsed.data} /> : null}
      {discParsed?.success ? <DiscResultView result={discParsed.data} /> : null}
      {kissParsed?.success ? (
        isSeller ? (
          <KissResultView result={kissParsed.data} showCoachingScore />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coaching KISS</CardTitle>
              <CardDescription>
                Le détail KISS et le score de coaching sont visibles uniquement par
                le commercial assigné à ce rendez-vous.
              </CardDescription>
            </CardHeader>
          </Card>
        )
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mail de suivi client</CardTitle>
          <CardDescription>
            Généré à partir du transcript et des analyses — à relire avant envoi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingFollowUpEmailBlock
            meetingId={meeting.id}
            initialDraft={meeting.followUpEmailDraft}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted max-h-[320px] overflow-auto rounded-lg p-4 text-xs whitespace-pre-wrap">
            {meeting.transcript}
          </pre>
        </CardContent>
      </Card>

      {meeting.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
