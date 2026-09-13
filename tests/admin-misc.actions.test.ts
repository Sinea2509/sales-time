import { beforeEach, describe, expect, it } from "@jest/globals";

type JestFn = jest.Mock;

const ACTOR_ID = "cjld2cjxh0000qzrmn831i7rn";
const OTHER_USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";
const LOG_ID = "cllog00000000000000000001";
const FEEDBACK_ID = "clfb000000000000000000001";

type AdminMiscDepsMocks = {
  getAuthenticatedPrincipalMock: JestFn;
  findByIdMock: JestFn;
  adminSearchMock: Record<string, JestFn>;
  aiLogsMock: Record<string, JestFn>;
  feedbacksMock: Record<string, JestFn>;
  auditLogPlatformActionMock: JestFn;
};

jest.mock("@/lib/application-deps", () => {
  const mocks: AdminMiscDepsMocks = {
    getAuthenticatedPrincipalMock: jest.fn(),
    findByIdMock: jest.fn(),
    adminSearchMock: {
      searchUsersAndOrganizations: jest.fn(),
    },
    aiLogsMock: {
      findById: jest.fn(),
      createLog: jest.fn().mockResolvedValue(undefined),
    },
    feedbacksMock: {
      updateStatus: jest.fn().mockResolvedValue(undefined),
    },
    auditLogPlatformActionMock: jest.fn().mockResolvedValue(undefined),
  };
  const graph = {
    auth: {
      getAuthenticatedPrincipal: mocks.getAuthenticatedPrincipalMock,
    },
    users: {
      findById: mocks.findByIdMock,
    },
    adminSearch: mocks.adminSearchMock,
    aiLogs: mocks.aiLogsMock,
    feedbacks: mocks.feedbacksMock,
    audit: {
      logPlatformAction: mocks.auditLogPlatformActionMock,
    },
  };
  (graph as { __adminMiscTestMocks?: AdminMiscDepsMocks }).__adminMiscTestMocks =
    mocks;
  return { getApplicationDeps: () => graph };
});

// eslint-disable-next-line no-var -- Jest mock factories run before `let` bindings exist
var revalidatePathMock: JestFn;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
});

// eslint-disable-next-line no-var
var generateObjectMock: JestFn;
jest.mock("ai", () => {
  generateObjectMock = jest.fn();
  return { generateObject: generateObjectMock };
});

// eslint-disable-next-line no-var
var saveGlobalKissCoachingPromptsMock: JestFn;
jest.mock("@/src/core/application/save-global-kiss-coaching-prompts", () => {
  saveGlobalKissCoachingPromptsMock = jest.fn();
  return { saveGlobalKissCoachingPrompts: saveGlobalKissCoachingPromptsMock };
});

import { searchAdminAction } from "@/app/[locale]/admin/search-actions";
import { replayAiLogAction } from "@/app/[locale]/admin/ai-logs/actions";
import { updateFeedbackStatusAction } from "@/app/[locale]/admin/feedbacks/actions";
import { saveGlobalKissConsignesAction } from "@/app/[locale]/admin/prompts/kiss-consignes/actions";
import { DEFAULT_ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-gateway-models";
import { getApplicationDeps } from "@/lib/application-deps";
import type { KissCoachingPromptsForm } from "@/src/core/domain/kiss-org-coaching-prompts";

const {
  getAuthenticatedPrincipalMock,
  findByIdMock,
  adminSearchMock,
  aiLogsMock,
  feedbacksMock,
  auditLogPlatformActionMock,
} = (
  getApplicationDeps() as unknown as { __adminMiscTestMocks: AdminMiscDepsMocks }
).__adminMiscTestMocks;

const validKissForm: KissCoachingPromptsForm = {
  keep: { global: "k1", manager: "k2", commercial: "k3" },
  improve: { global: "i1", manager: "i2", commercial: "i3" },
  start: { global: "s1", manager: "s2", commercial: "s3" },
  stop: { global: "t1", manager: "t2", commercial: "t3" },
};

function mockAuthenticatedSuperAdminPrincipal() {
  getAuthenticatedPrincipalMock.mockResolvedValue({ userId: ACTOR_ID });
  findByIdMock.mockResolvedValue({
    id: ACTOR_ID,
    email: "actor@test.com",
    systemRoles: ["SUPER_ADMIN"],
  });
}

function mockAiLog(overrides: Partial<{
  userPrompt: string | null;
  modelName: string | null;
  systemPrompt: string | null;
  promptVersion: string;
  organizationId: string | null;
  meetingId: string | null;
  jobId: string | null;
  kind: string;
}> = {}) {
  return {
    organizationId: "clorg00000000000000000001",
    meetingId: "clmtg00000000000000000001",
    jobId: "cljob00000000000000000001",
    kind: "SONCAS",
    modelName: "openai/gpt-4o",
    promptVersion: "v3",
    systemPrompt: "System prompt",
    userPrompt: "User prompt",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getAuthenticatedPrincipalMock.mockReset();
  findByIdMock.mockReset();
  generateObjectMock.mockReset();
  saveGlobalKissCoachingPromptsMock.mockReset();
  saveGlobalKissCoachingPromptsMock.mockResolvedValue({ ok: true });
  for (const fn of [
    ...Object.values(adminSearchMock),
    ...Object.values(aiLogsMock),
    ...Object.values(feedbacksMock),
  ]) {
    if (typeof fn === "function" && "mockReset" in fn) {
      (fn as ReturnType<typeof jest.fn>).mockReset();
    }
  }
  aiLogsMock.createLog.mockResolvedValue(undefined);
  auditLogPlatformActionMock.mockResolvedValue(undefined);
  mockAuthenticatedSuperAdminPrincipal();
});

describe("admin misc: searchAdminAction", () => {
  it("returns empty results when not super admin", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);

    const r = await searchAdminAction("alice");
    expect(r).toEqual({ users: [], organizations: [] });
    expect(adminSearchMock.searchUsersAndOrganizations).not.toHaveBeenCalled();
  });

  it("returns empty results when principal lacks super admin role", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: OTHER_USER_ID });
    findByIdMock.mockResolvedValue({
      id: OTHER_USER_ID,
      email: "member@test.com",
      systemRoles: [],
    });

    const r = await searchAdminAction("alice");
    expect(r).toEqual({ users: [], organizations: [] });
    expect(adminSearchMock.searchUsersAndOrganizations).not.toHaveBeenCalled();
  });

  it("returns empty results for blank query", async () => {
    mockAuthenticatedSuperAdminPrincipal();

    const r = await searchAdminAction("   ");
    expect(r).toEqual({ users: [], organizations: [] });
    expect(adminSearchMock.searchUsersAndOrganizations).not.toHaveBeenCalled();
  });

  it("delegates trimmed query to admin search", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const payload = {
      users: [{ id: "u1", email: "a@x.com", firstName: "A", lastName: "B" }],
      organizations: [{ id: "o1", name: "Org", slug: "org" }],
    };
    adminSearchMock.searchUsersAndOrganizations.mockResolvedValue(payload);

    const r = await searchAdminAction("  alice  ");
    expect(r).toEqual(payload);
    expect(adminSearchMock.searchUsersAndOrganizations).toHaveBeenCalledWith(
      "alice",
    );
  });
});

describe("admin misc: replayAiLogAction", () => {
  it("rejects unauthenticated replay", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: false, error: "UNAUTHENTICATED" });
    expect(aiLogsMock.findById).not.toHaveBeenCalled();
  });

  it("rejects non–super admin replay", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: OTHER_USER_ID });
    findByIdMock.mockResolvedValue({
      id: OTHER_USER_ID,
      email: "member@test.com",
      systemRoles: ["MEMBER"],
    });

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(aiLogsMock.findById).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when log missing or has no user prompt", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    aiLogsMock.findById.mockResolvedValue(null);

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when log user prompt is empty", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    aiLogsMock.findById.mockResolvedValue(mockAiLog({ userPrompt: null }));

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("replays log, writes success log, audits, and revalidates", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    const log = mockAiLog();
    aiLogsMock.findById.mockResolvedValue(log);
    generateObjectMock.mockResolvedValue({
      object: { replay: "ok" },
      usage: { inputTokens: 10, outputTokens: 5 },
    });

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: true });
    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai/gpt-4o",
        prompt: "User prompt",
        system: "System prompt",
      }),
    );
    expect(aiLogsMock.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "SUCCESS",
        modelName: "openai/gpt-4o",
        promptVersion: "v3-replay",
        rawOutput: { replay: "ok" },
        inputTokens: 10,
        outputTokens: 5,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/ai-logs");
    expect(auditLogPlatformActionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: ACTOR_ID,
        action: "REPLAY_AI_LOG",
        reason: expect.stringContaining(LOG_ID),
      }),
    );
  });

  it("uses default model when log model name is blank", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    aiLogsMock.findById.mockResolvedValue(mockAiLog({ modelName: "  " }));
    generateObjectMock.mockResolvedValue({
      object: { replay: "ok" },
      usage: undefined,
    });

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: true });
    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: DEFAULT_ANALYSIS_GATEWAY_MODEL }),
    );
    expect(aiLogsMock.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "SUCCESS",
        modelName: DEFAULT_ANALYSIS_GATEWAY_MODEL,
        inputTokens: null,
        outputTokens: null,
      }),
    );
  });

  it("writes error log and returns REPLAY_FAILED on generateObject failure", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    aiLogsMock.findById.mockResolvedValue(mockAiLog({ systemPrompt: null }));
    generateObjectMock.mockRejectedValue(new Error("Gateway timeout"));

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: false, error: "REPLAY_FAILED" });
    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "Replay SalesTime AI call.",
      }),
    );
    expect(aiLogsMock.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        errorMessage: "Gateway timeout",
      }),
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(auditLogPlatformActionMock).not.toHaveBeenCalled();
  });

  it("uses fallback error message for non-Error replay failures", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    aiLogsMock.findById.mockResolvedValue(mockAiLog());
    generateObjectMock.mockRejectedValue("boom");

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: false, error: "REPLAY_FAILED" });
    expect(aiLogsMock.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        errorMessage: "Replay failed",
      }),
    );
  });

  it("audits replay with system org when log has no organization", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    aiLogsMock.findById.mockResolvedValue(
      mockAiLog({ organizationId: null }),
    );
    generateObjectMock.mockResolvedValue({
      object: { replay: "ok" },
      usage: undefined,
    });

    const r = await replayAiLogAction(LOG_ID);
    expect(r).toEqual({ ok: true });
    expect(auditLogPlatformActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "system" }),
    );
  });
});

describe("admin misc: updateFeedbackStatusAction", () => {
  it("rejects invalid input", async () => {
    mockAuthenticatedSuperAdminPrincipal();

    const r = await updateFeedbackStatusAction({
      id: "",
      status: "NEW",
    });
    expect(r).toEqual({ ok: false });
    expect(feedbacksMock.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated update", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);

    const r = await updateFeedbackStatusAction({
      id: FEEDBACK_ID,
      status: "IN_PROGRESS",
    });
    expect(r).toEqual({ ok: false });
    expect(feedbacksMock.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects non–super admin update", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: OTHER_USER_ID });
    findByIdMock.mockResolvedValue({
      id: OTHER_USER_ID,
      email: "member@test.com",
      systemRoles: [],
    });

    const r = await updateFeedbackStatusAction({
      id: FEEDBACK_ID,
      status: "RESOLVED",
    });
    expect(r).toEqual({ ok: false });
    expect(feedbacksMock.updateStatus).not.toHaveBeenCalled();
  });

  it("updates feedback, audits, and revalidates for super admin", async () => {
    mockAuthenticatedSuperAdminPrincipal();

    const r = await updateFeedbackStatusAction({
      id: FEEDBACK_ID,
      status: "WONT_FIX",
      adminNotes: "Duplicate report",
    });
    expect(r).toEqual({ ok: true });
    expect(feedbacksMock.updateStatus).toHaveBeenCalledWith({
      id: FEEDBACK_ID,
      status: "WONT_FIX",
      adminNotes: "Duplicate report",
    });
    expect(auditLogPlatformActionMock).toHaveBeenCalledWith({
      actorUserId: ACTOR_ID,
      organizationId: "system",
      action: "UPDATE_FEEDBACK",
      reason: `Feedback ${FEEDBACK_ID} → WONT_FIX`,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/feedbacks");
  });
});

describe("admin misc: saveGlobalKissConsignesAction", () => {
  it("rejects invalid form payload", async () => {
    mockAuthenticatedSuperAdminPrincipal();

    const r = await saveGlobalKissConsignesAction({} as KissCoachingPromptsForm);
    expect(r).toEqual({ ok: false, error: "VALIDATION" });
    expect(saveGlobalKissCoachingPromptsMock).not.toHaveBeenCalled();
  });

  it("rejects when unauthenticated", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);

    const r = await saveGlobalKissConsignesAction(validKissForm);
    expect(r).toEqual({ ok: false, error: "NO_USER" });
    expect(saveGlobalKissCoachingPromptsMock).not.toHaveBeenCalled();
  });

  it("rejects when user row is missing", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({ userId: ACTOR_ID });
    findByIdMock.mockResolvedValue(null);

    const r = await saveGlobalKissConsignesAction(validKissForm);
    expect(r).toEqual({ ok: false, error: "NO_USER" });
    expect(saveGlobalKissCoachingPromptsMock).not.toHaveBeenCalled();
  });

  it("returns NOT_SUPER_ADMIN when save use case denies access", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    saveGlobalKissCoachingPromptsMock.mockResolvedValue({
      ok: false,
      error: "NOT_SUPER_ADMIN",
    });

    const r = await saveGlobalKissConsignesAction(validKissForm);
    expect(r).toEqual({ ok: false, error: "NOT_SUPER_ADMIN" });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("maps USER_NOT_SYNCED from save use case to NO_USER", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    saveGlobalKissCoachingPromptsMock.mockResolvedValue({
      ok: false,
      error: "USER_NOT_SYNCED",
    });

    const r = await saveGlobalKissConsignesAction(validKissForm);
    expect(r).toEqual({ ok: false, error: "NO_USER" });
  });

  it("maps PERSIST_FAILED to SAVE_FAILED with message", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    saveGlobalKissCoachingPromptsMock.mockResolvedValue({
      ok: false,
      error: "PERSIST_FAILED",
      message: "DB down",
    });

    const r = await saveGlobalKissConsignesAction(validKissForm);
    expect(r).toEqual({
      ok: false,
      error: "SAVE_FAILED",
      message: "DB down",
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("saves consignes and revalidates admin prompt paths", async () => {
    mockAuthenticatedSuperAdminPrincipal();
    saveGlobalKissCoachingPromptsMock.mockResolvedValue({ ok: true });

    const r = await saveGlobalKissConsignesAction(validKissForm);
    expect(r).toEqual({ ok: true });
    expect(saveGlobalKissCoachingPromptsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actorInternalUserId: ACTOR_ID,
        isSuperAdmin: true,
        form: validKissForm,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/admin/prompts/kiss-consignes",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/prompts");
  });
});
