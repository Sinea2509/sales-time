import { after } from "next/server";
import { getApplicationDeps } from "@/lib/application-deps";
import { checkAiGatewayConfigured } from "@/lib/env";
import { processAnalysisJobs } from "@/src/core/application/process-analysis-jobs";

/** Runs queued analysis jobs in-process after a server action response. */
export function scheduleAnalysisJobsAfterResponse(): void {
  after(async () => {
    const ai = checkAiGatewayConfigured();
    if (!ai.ok) {
      console.error("scheduleAnalysisJobsAfterResponse: AI not configured");
      return;
    }

    try {
      const deps = getApplicationDeps();
      const result = await processAnalysisJobs(deps, {
        workerId: `after-${Date.now()}`,
      });
      console.info("scheduleAnalysisJobsAfterResponse: done", result);
    } catch (cause) {
      console.error("scheduleAnalysisJobsAfterResponse: failed", cause);
    }
  });
}
