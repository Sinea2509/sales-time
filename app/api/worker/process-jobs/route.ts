import { NextResponse } from "next/server";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getApplicationDeps } from "@/lib/application-deps";
import { processAnalysisJobs } from "@/src/core/application/process-analysis-jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deps = getApplicationDeps();
  const workerId = `cron-${Date.now()}`;
  const result = await processAnalysisJobs(deps, {
    workerId,
    model: ANALYSIS_GATEWAY_MODEL,
  });

  return NextResponse.json({ ok: true, ...result });
}
