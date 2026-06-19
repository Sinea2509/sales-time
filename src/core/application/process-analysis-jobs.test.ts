import { describe, expect, it, beforeEach } from "@jest/globals";

jest.mock("./run-meeting-analysis", () => ({
  runMeetingAnalysis: jest.fn(),
}));

jest.mock("@/lib/email/mailer", () => ({
  sendTransactionalEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/kiss-org-appendix-for-analysis", () => ({
  kissMarkdownAppendixForAudience: jest.fn().mockReturnValue("kiss appendix"),
}));

import { runMeetingAnalysis } from "./run-meeting-analysis";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { processAnalysisJobs } from "./process-analysis-jobs";

const mockedRun = runMeetingAnalysis as jest.MockedFunction<
  typeof runMeetingAnalysis
>;
const mockedEmail = sendTransactionalEmail as jest.MockedFunction<
  typeof sendTransactionalEmail
>;

function makeDeps(over: {
  job?: {
    id: string;
    meetingId: string;
    organizationId: string;
    attempts: number;
    maxAttempts: number;
  } | null;
  meeting?: {
    id: string;
    organizationId: string;
    sellerUserId: string;
    personId: string;
    prospectName: string;
  } | null;
} = {}) {
  const job = over.job ?? {
    id: "job_1",
    meetingId: "meet_1",
    organizationId: "org_1",
    attempts: 1,
    maxAttempts: 3,
  };

  return {
    analysisJobs: {
      releaseStaleProcessingJobs: jest.fn().mockResolvedValue(2),
      dequeueNextJob: jest
        .fn()
        .mockResolvedValueOnce(job)
        .mockResolvedValue(null),
      markJobDone: jest.fn().mockResolvedValue(undefined),
      markJobFailed: jest.fn().mockResolvedValue(undefined),
    },
    meetings: {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue(
        over.meeting === null
          ? null
          : (over.meeting ?? {
              id: "meet_1",
              organizationId: "org_1",
              sellerUserId: "seller_1",
              personId: "person_1",
              prospectName: "Acme",
            }),
      ),
      updateMeetingStatus: jest.fn().mockResolvedValue(true),
      findLatestAnalysisForMeeting: jest.fn().mockResolvedValue(null),
      updatePersonProfileCache: jest.fn().mockResolvedValue(undefined),
    },
    prompts: {
      getModelForKind: jest.fn().mockResolvedValue("openai/gpt-4o-mini"),
    },
    analysis: {},
    aiLogs: { createLog: jest.fn().mockResolvedValue({}) },
    globalKissCoachingPrompts: {
      getPrompts: jest.fn().mockResolvedValue({}),
    },
    notifications: {
      create: jest.fn().mockResolvedValue({}),
    },
    users: {
      findEmailById: jest.fn().mockResolvedValue("seller@example.com"),
    },
  };
}

describe("processAnalysisJobs", () => {
  beforeEach(() => {
    mockedRun.mockReset();
    mockedEmail.mockClear();
  });

  it("returns zero processed when queue is empty", async () => {
    const deps = makeDeps();
    deps.analysisJobs.dequeueNextJob = jest.fn().mockResolvedValue(null);

    const result = await processAnalysisJobs(deps as never, {
      workerId: "w1",
    });

    expect(result).toEqual({
      processed: 0,
      succeeded: 0,
      failed: 0,
      releasedStale: 2,
    });
  });

  it("marks job failed when meeting is missing", async () => {
    const deps = makeDeps({ meeting: null });

    const result = await processAnalysisJobs(deps as never, {
      workerId: "w1",
    });

    expect(result.failed).toBe(1);
    expect(deps.analysisJobs.markJobFailed).toHaveBeenCalledWith({
      jobId: "job_1",
      error: "Meeting not found",
      requeue: false,
    });
  });

  it("completes job and notifies seller on full analysis success", async () => {
    mockedRun.mockResolvedValue({ ok: true, analysisId: "a1" });
    const deps = makeDeps();

    const result = await processAnalysisJobs(deps as never, {
      workerId: "w1",
    });

    expect(result.succeeded).toBe(1);
    expect(mockedRun).toHaveBeenCalledTimes(3);
    expect(deps.meetings.updateMeetingStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "READY" }),
    );
    expect(deps.analysisJobs.markJobDone).toHaveBeenCalledWith("job_1");
    expect(deps.notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "seller_1",
        title: "Analyse terminée",
      }),
    );
    expect(mockedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "seller@example.com" }),
    );
  });

  it("marks meeting FAILED when analysis step fails", async () => {
    mockedRun
      .mockResolvedValueOnce({ ok: true, analysisId: "a1" })
      .mockResolvedValueOnce({
        ok: false,
        error: "PROMPT_NOT_CONFIGURED",
        message: "No prompt",
      });

    const deps = makeDeps();

    const result = await processAnalysisJobs(deps as never, {
      workerId: "w1",
    });

    expect(result.failed).toBe(1);
    expect(deps.meetings.updateMeetingStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        errorMessage: "No prompt",
      }),
    );
    expect(deps.analysisJobs.markJobFailed).toHaveBeenCalledWith(
      expect.objectContaining({ requeue: true }),
    );
  });
});
