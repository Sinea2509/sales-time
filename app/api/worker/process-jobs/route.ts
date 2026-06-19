import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { checkAiGatewayConfigured } from "@/lib/env";
import { getApplicationDeps } from "@/lib/application-deps";
import { processAnalysisJobs } from "@/src/core/application/process-analysis-jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ai = checkAiGatewayConfigured();
  if (!ai.ok) {
    console.error(
      "process-jobs: AI_GATEWAY_API_KEY is missing — analysis worker cannot run",
    );
    return NextResponse.json(
      { ok: false, error: "AI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const deps = getApplicationDeps();
  const workerId = `cron-${Date.now()}`;
  const result = await processAnalysisJobs(deps, {
    workerId,
  });

  return NextResponse.json({ ok: true, ...result });
}
