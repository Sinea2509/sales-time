import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DiscResultView } from "@/components/molecules/disc-result-view";
import { SoncasResultView } from "@/components/molecules/soncas-result-view";
import { MeetingAnalysisButtons } from "@/components/organisms/meeting-analysis-buttons";
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
  const soncasParsed = soncas
    ? soncasResultSchema.safeParse(soncas.result)
    : null;
  const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {meeting.prospectName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {new Date(meeting.meetingAt).toLocaleString()} · {meeting.outcome}
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
          </div>
          <MeetingAnalysisButtons meetingId={meeting.id} />
        </CardContent>
      </Card>

      {soncasParsed?.success ? <SoncasResultView result={soncasParsed.data} /> : null}
      {discParsed?.success ? <DiscResultView result={discParsed.data} /> : null}

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
