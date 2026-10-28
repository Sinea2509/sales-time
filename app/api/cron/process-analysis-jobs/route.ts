import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { checkAiGatewayConfigured } from "@/lib/env";
import { getApplicationDeps } from "@/lib/application-deps";
import { processAnalysisJobs } from "@/src/core/application/process-analysis-jobs";
import { requeueMeetingsWithReadableSpeakers } from "@/src/core/application/requeue-meetings-with-readable-speakers";
import { requeueUnscoredFollowUpMeetings } from "@/src/core/application/requeue-unscored-follow-up-meetings";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ai = checkAiGatewayConfigured();
  if (!ai.ok) {
    console.error(
      "process-analysis-jobs: AI_GATEWAY_API_KEY is missing: analysis worker cannot run",
    );
    return NextResponse.json(
      { ok: false, error: "AI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const deps = getApplicationDeps();
  /*
    Les rendez-vous analysés avant une correction du lecteur de transcript
    sont remis en file une fois, puis traités ici comme les autres.
  */
  const remeasured = await requeueMeetingsWithReadableSpeakers(deps, {
    limit: 10,
  }).catch((cause) => {
    console.error("process-analysis-jobs: remeasure failed", cause);
    return 0;
  });
  /*
    Les démos, propositions et négociations analysées avant la grille de suivi
    n'ont pas de score : elles sont remises en file une fois pour être notées.
    Une par passage, traitée juste en dessous : une analyse complète occupe à
    peu près un passage, et un rendez-vous remis en file sans être traité
    resterait affiché « en cours », puis « bloqué », jusqu'aux suivants.
  */
  const rescored = await requeueUnscoredFollowUpMeetings(deps, {
    limit: 1,
  }).catch((cause) => {
    console.error("process-analysis-jobs: rescore failed", cause);
    return 0;
  });
  const workerId = `cron-${Date.now()}`;
  const result = await processAnalysisJobs(deps, {
    workerId,
  });

  return NextResponse.json({ ok: true, ...result, remeasured, rescored });
}
