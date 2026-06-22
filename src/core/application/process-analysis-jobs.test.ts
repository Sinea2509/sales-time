import { describe, expect, it, beforeEach } from "@jest/globals";

jest.mock("./run-all-meeting-analyses-for-org", () => ({
  runAllMeetingAnalysesForOrg: jest.fn(),
}));

jest.mock("@/lib/email/mailer", () => ({
  sendTransactionalEmail: jest.fn().mockResolvedValue(undefined),
}));

import { runAllMeetingAnalysesForOrg } from "./run-all-meeting-analyses-for-org";
import { processAnalysisJobs } from "./process-analysis-jobs";

const mockedRunAll = runAllMeetingAnalysesForOrg as jest.MockedFunction<
  typeof runAllMeetingAnalysesForOrg
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
    mockedRunAll.mockReset();
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

  it("completes job when full analysis succeeds", async () => {
    mockedRunAll.mockResolvedValue({ ok: true });
    const deps = makeDeps();

    const result = await processAnalysisJobs(deps as never, {
      workerId: "w1",
    });

    expect(result.succeeded).toBe(1);
    expect(mockedRunAll).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: "org_1",
        meetingId: "meet_1",
        jobId: "job_1",
        notifyOnComplete: true,
      }),
    );
    expect(deps.analysisJobs.markJobDone).toHaveBeenCalledWith("job_1");
  });

  it("marks job failed when analysis step fails", async () => {
    mockedRunAll.mockResolvedValue({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "No prompt",
    });

    const deps = makeDeps();

    const result = await processAnalysisJobs(deps as never, {
      workerId: "w1",
    });

    expect(result.failed).toBe(1);
    expect(deps.analysisJobs.markJobFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "No prompt",
        requeue: true,
      }),
    );
  });
});
