import { beforeEach, describe, expect, it } from "@jest/globals";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  createCoachSharedPhrase,
  listCoachSharedPhrases,
} from "@/app/[locale]/company/coach-shared-phrases-actions";
import {
  createContactInlineAction,
  createContactAction,
  deleteContactAction,
  searchContactsPickerAction,
  updateContactAction,
} from "@/app/[locale]/company/contacts/actions";
import {
  getTeamMemberPerformanceFingerprintAction,
  refreshTeamMemberPerformanceAction,
} from "@/app/[locale]/company/equipe/actions";
import { prepareBriefingAction } from "@/app/[locale]/company/preparer/actions";
import { searchOrgAction } from "@/app/[locale]/company/recherche/actions";
import {
  createMeetingAction,
  deleteMeetingAction,
  getMeetingForEditAction,
  getOrgMeetingFormOptionsAction,
  updateMeetingAction,
} from "@/app/[locale]/company/rendez-vous/actions";
import {
  generateFollowUpEmailAction,
  runAllMeetingAnalysesAction,
} from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { getApplicationDeps } from "@/lib/application-deps";
import { DEFAULT_OBJECTION_PHRASES } from "@/lib/onboarding-shared-default-phrases";

type JestFn = jest.Mock;

const ORG_ID = "clorg00000000000000000001";
const USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";
const PERSON_ID = "clh12345678901234567890123";
const MEETING_ID = "clm12345678901234567890123";
const SELLER_ID = "clu12345678901234567890123";

// eslint-disable-next-line no-var
var normalizePhraseKeyMock: JestFn;
jest.mock("@/lib/onboarding-shared-default-phrases", () => {
  const actual = jest.requireActual<
    typeof import("@/lib/onboarding-shared-default-phrases")
  >("@/lib/onboarding-shared-default-phrases");
  normalizePhraseKeyMock = jest.fn(actual.normalizePhraseKey);
  return {
    ...actual,
    normalizePhraseKey: normalizePhraseKeyMock,
  };
});

// eslint-disable-next-line no-var
var revalidatePathMock: JestFn;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
});

// eslint-disable-next-line no-var
var redirectMock: JestFn;
jest.mock("next/navigation", () => {
  redirectMock = jest.fn();
  return {
    redirect: (url: string) => {
      redirectMock(url);
      throw new Error(`REDIRECT:${url}`);
    },
  };
});

// eslint-disable-next-line no-var
var getCurrentActorContextMock: JestFn;
jest.mock("@/src/core/application/get-current-actor-context", () => {
  getCurrentActorContextMock = jest.fn();
  return { getCurrentActorContext: getCurrentActorContextMock };
});

// eslint-disable-next-line no-var
var createMeetingForOrgMock: JestFn;
jest.mock("@/src/core/application/create-meeting", () => {
  createMeetingForOrgMock = jest.fn();
  return { createMeetingForOrg: createMeetingForOrgMock };
});

// eslint-disable-next-line no-var
var updateMeetingForOrgMock: JestFn;
jest.mock("@/src/core/application/update-meeting-for-org", () => {
  updateMeetingForOrgMock = jest.fn();
  return { updateMeetingForOrg: updateMeetingForOrgMock };
});

// eslint-disable-next-line no-var
var uploadMeetingTranscriptFileMock: JestFn;
jest.mock("@/lib/meeting-transcript-upload", () => {
  uploadMeetingTranscriptFileMock = jest.fn();
  return { uploadMeetingTranscriptFile: uploadMeetingTranscriptFileMock };
});

jest.mock("@/lib/blob-paths", () => ({
  blobUrlBelongsToOrg: jest.fn(() => true),
}));

// eslint-disable-next-line no-var
var scheduleAnalysisJobsAfterResponseMock: JestFn;
jest.mock("@/app/[locale]/company/rendez-vous/schedule-analysis-jobs", () => {
  scheduleAnalysisJobsAfterResponseMock = jest.fn();
  return { scheduleAnalysisJobsAfterResponse: scheduleAnalysisJobsAfterResponseMock };
});

import { blobUrlBelongsToOrg } from "@/lib/blob-paths";

// eslint-disable-next-line no-var
var revalidateTeamMemberPerformancePathsMock: JestFn;
jest.mock("@/lib/revalidate-team-member-paths", () => {
  revalidateTeamMemberPerformancePathsMock = jest.fn();
  return {
    revalidateTeamMemberPerformancePaths: revalidateTeamMemberPerformancePathsMock,
  };
});

// eslint-disable-next-line no-var
var readSuperAdminOrgCookieMock: JestFn;
jest.mock("@/lib/read-super-admin-org-cookie", () => {
  readSuperAdminOrgCookieMock = jest.fn().mockResolvedValue(null);
  return { readSuperAdminOrgCookie: readSuperAdminOrgCookieMock };
});

// eslint-disable-next-line no-var
var getTeamMemberPerformanceProfileMock: JestFn;
jest.mock("@/src/core/application/get-team-member-performance-profile", () => {
  getTeamMemberPerformanceProfileMock = jest.fn();
  return {
    getTeamMemberPerformanceProfile: getTeamMemberPerformanceProfileMock,
  };
});

// eslint-disable-next-line no-var
var runAllMeetingAnalysesForOrgMock: JestFn;
jest.mock("@/src/core/application/run-all-meeting-analyses-for-org", () => {
  runAllMeetingAnalysesForOrgMock = jest.fn();
  return { runAllMeetingAnalysesForOrg: runAllMeetingAnalysesForOrgMock };
});

// eslint-disable-next-line no-var
var generateFollowUpEmailForMeetingMock: JestFn;
jest.mock("@/src/core/application/generate-follow-up-email", () => {
  generateFollowUpEmailForMeetingMock = jest.fn();
  return { generateFollowUpEmailForMeeting: generateFollowUpEmailForMeetingMock };
});

// eslint-disable-next-line no-var
var loadResolvedFollowUpEmailPreferencesMock: JestFn;
jest.mock(
  "@/src/core/application/load-resolved-follow-up-email-preferences",
  () => {
    loadResolvedFollowUpEmailPreferencesMock = jest.fn();
    return {
      loadResolvedFollowUpEmailPreferences:
        loadResolvedFollowUpEmailPreferencesMock,
    };
  },
);

// eslint-disable-next-line no-var
var requireAnalysisActorMock: JestFn;
jest.mock("@/lib/analysis-server-context", () => {
  const actual = jest.requireActual<
    typeof import("@/lib/analysis-server-context")
  >("@/lib/analysis-server-context");
  requireAnalysisActorMock = jest.fn();
  return {
    ...actual,
    requireAnalysisActor: (...args: unknown[]) =>
      requireAnalysisActorMock(...args),
  };
});

type CompanyDepsMocks = {
  getAuthenticatedPrincipalMock: JestFn;
  findByIdMock: JestFn;
  onboardingSharedPhrasesMock: Record<string, JestFn>;
  contactsMock: Record<string, JestFn>;
  meetingsMock: Record<string, JestFn>;
  organizationTeamMock: Record<string, JestFn>;
  organizationSettingsMock: Record<string, JestFn>;
  organizationQuotaMock: Record<string, JestFn>;
  analysisJobsMock: Record<string, JestFn>;
  analysisMock: Record<string, JestFn>;
  promptsMock: Record<string, JestFn>;
  aiSummaryCacheMock: Record<string, JestFn>;
};

jest.mock("@/lib/application-deps", () => {
  const mocks: CompanyDepsMocks = {
    getAuthenticatedPrincipalMock: jest.fn(),
    findByIdMock: jest.fn(),
    onboardingSharedPhrasesMock: {
      listByKind: jest.fn().mockResolvedValue([]),
      createPhrase: jest.fn(),
    },
    contactsMock: {
      searchByPrefix: jest.fn().mockResolvedValue([]),
      findProspectCompanyAliasByPersonId: jest
        .fn()
        .mockResolvedValue(new Map()),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      deleteByIdForOrg: jest.fn(),
    },
    meetingsMock: {
      searchMeetingsForOrg: jest.fn().mockResolvedValue([]),
      listRecentMeetingsForDashboard: jest.fn().mockResolvedValue([]),
      listMeetingsForPersonOrdered: jest.fn().mockResolvedValue([]),
      findMeetingByIdForOrg: jest.fn(),
      deleteMeetingByIdForOrg: jest.fn().mockResolvedValue(undefined),
      findMeetingDetailWithAnalyses: jest.fn(),
      updateMeetingFollowUpDraft: jest.fn().mockResolvedValue(undefined),
      updateMeetingStatus: jest.fn().mockResolvedValue(undefined),
    },
    organizationTeamMock: {
      listMembersAndPendingInvitations: jest
        .fn()
        .mockResolvedValue({ members: [], pendingInvitations: [] }),
      findMembershipForManagerView: jest.fn(),
    },
    organizationSettingsMock: {
      findByOrganizationId: jest.fn().mockResolvedValue(null),
    },
    organizationQuotaMock: {
      getTrialAnalysesLeft: jest.fn().mockResolvedValue(0),
      decrementTrialAnalysesLeft: jest.fn().mockResolvedValue(undefined),
    },
    analysisJobsMock: {
      enqueueMeetingAnalysis: jest.fn().mockResolvedValue(undefined),
    },
    analysisMock: {
      prepareMeetingBriefing: jest.fn(),
    },
    promptsMock: {
      getCurrentVersion: jest.fn().mockResolvedValue(null),
      getModelForKind: jest.fn().mockResolvedValue(null),
    },
    aiSummaryCacheMock: {
      invalidateForOrganization: jest.fn().mockResolvedValue(undefined),
    },
  };
  const graph = {
    auth: { getAuthenticatedPrincipal: mocks.getAuthenticatedPrincipalMock },
    users: { findById: mocks.findByIdMock },
    onboardingSharedPhrases: mocks.onboardingSharedPhrasesMock,
    contacts: mocks.contactsMock,
    meetings: mocks.meetingsMock,
    organizationTeam: mocks.organizationTeamMock,
    organizationSettings: mocks.organizationSettingsMock,
    organizationQuota: mocks.organizationQuotaMock,
    analysisJobs: mocks.analysisJobsMock,
    analysis: mocks.analysisMock,
    prompts: mocks.promptsMock,
    aiSummaryCache: mocks.aiSummaryCacheMock,
  };
  (graph as { __companyTestMocks?: CompanyDepsMocks }).__companyTestMocks =
    mocks;
  return { getApplicationDeps: () => graph };
});

const {
  getAuthenticatedPrincipalMock,
  findByIdMock,
  onboardingSharedPhrasesMock,
  contactsMock,
  meetingsMock,
  organizationTeamMock,
  organizationSettingsMock,
  organizationQuotaMock,
  analysisJobsMock,
  analysisMock,
} = (getApplicationDeps() as unknown as { __companyTestMocks: CompanyDepsMocks })
  .__companyTestMocks;

function mockAuthenticatedActorContext(
  canManageOrganization = true,
  workspaceRoleMode: "admin" | "member" | null = canManageOrganization
    ? "admin"
    : "member",
) {
  getCurrentActorContextMock.mockResolvedValue({
    kind: "authenticated",
    userId: USER_ID,
    internalUserId: USER_ID,
    email: canManageOrganization ? "admin@test.com" : "seller@test.com",
    activeOrganizationId: ORG_ID,
    canManageOrganization,
    workspaceRoleMode,
    systemRoles: [],
  });
}

const ANALYZABLE_TEST_TRANSCRIPT =
  "Seller: Bonjour, merci pour votre temps aujourd'hui. Nous allons explorer vos enjeux de croissance et voir comment notre solution peut vous accompagner sur la sécurisation de vos processus et l'amélioration de votre ROI sur les prochains trimestres.";

function meetingFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    personId: "",
    prospectName: "Alice Prospect",
    meetingAt: "2026-06-22T10:00:00.000Z",
    durationMin: "30",
    transcript: ANALYZABLE_TEST_TRANSCRIPT,
    notes: "",
    meetingType: "Discovery",
    pipelineStage: "Qualif",
    potentialAmount: "1000",
    outcome: "FOLLOW_UP",
    feeling: "4",
    ...overrides,
  };
  for (const [key, value] of Object.entries(defaults)) {
    fd.set(key, value);
  }
  return fd;
}

function mockOrgAdminPrincipal() {
  getAuthenticatedPrincipalMock.mockResolvedValue({
    userId: USER_ID,
    email: "admin@test.com",
    firstName: "Ada",
    lastName: "Min",
    memberships: [{ organizationId: ORG_ID, role: "ADMIN" }],
    activeOrganizationIdFromCookie: ORG_ID,
    systemRoles: [],
  });
  mockAuthenticatedActorContext(true);
}

function mockOrgMemberPrincipal(userId = USER_ID) {
  getAuthenticatedPrincipalMock.mockResolvedValue({
    userId,
    email: "seller@test.com",
    firstName: "Sal",
    lastName: "Er",
    memberships: [{ organizationId: ORG_ID, role: "MEMBER" }],
    activeOrganizationIdFromCookie: ORG_ID,
    systemRoles: [],
  });
  mockAuthenticatedActorContext(false);
}

function mockNoOrgPrincipal() {
  getAuthenticatedPrincipalMock.mockResolvedValue({
    userId: USER_ID,
    email: "orphan@test.com",
    memberships: [],
    activeOrganizationIdFromCookie: null,
    systemRoles: [],
  });
  getCurrentActorContextMock.mockResolvedValue({
    kind: "authenticated",
    userId: USER_ID,
    activeOrganizationId: null,
    systemRoles: [],
  });
}

function prismaUniqueError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint", {
    code: "P2002",
    clientVersion: "test",
  });
}

function mockAnalysisActor(
  depsOverrides: Record<string, unknown> = {},
  actorOverrides: {
    actorUserId?: string;
    email?: string;
    canManageOrganization?: boolean;
  } = {},
) {
  const deps = {
    meetings: meetingsMock,
    organizationSettings: organizationSettingsMock,
    organizationTeam: organizationTeamMock,
    analysis: analysisMock,
    prompts: { getCurrentVersion: jest.fn(), getModelForKind: jest.fn() },
    ...depsOverrides,
  };
  requireAnalysisActorMock.mockResolvedValue({
    ok: true,
    organizationId: ORG_ID,
    actorUserId: actorOverrides.actorUserId ?? USER_ID,
    internalUserId: actorOverrides.actorUserId ?? USER_ID,
    email: actorOverrides.email ?? "admin@test.com",
    canManageOrganization: actorOverrides.canManageOrganization ?? true,
    workspaceRoleMode: actorOverrides.canManageOrganization === false ? "member" : "admin",
    deps,
  });
  return deps;
}

beforeEach(() => {
  jest.clearAllMocks();
  const actual = jest.requireActual<
    typeof import("@/lib/onboarding-shared-default-phrases")
  >("@/lib/onboarding-shared-default-phrases");
  normalizePhraseKeyMock.mockImplementation(actual.normalizePhraseKey);
  readSuperAdminOrgCookieMock.mockResolvedValue(null);
  mockOrgAdminPrincipal();
  mockAuthenticatedActorContext();
  findByIdMock.mockResolvedValue({ id: USER_ID, email: "admin@test.com" });
  getTeamMemberPerformanceProfileMock.mockResolvedValue({
    performanceForces: "Forces",
    performanceAxes: "Axes",
    performanceStop: "Stop",
    fingerprint: "fp",
    meetingCount: 2,
  });
  runAllMeetingAnalysesForOrgMock.mockResolvedValue({ ok: true });
  loadResolvedFollowUpEmailPreferencesMock.mockResolvedValue({});
  generateFollowUpEmailForMeetingMock.mockResolvedValue({
    subject: "Subject",
    bodyMarkdown: "Body",
  });
  mockAnalysisActor();
  meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
    id: MEETING_ID,
    sellerUserId: USER_ID,
  });
  createMeetingForOrgMock.mockResolvedValue({
    ok: true,
    meetingId: MEETING_ID,
  });
  updateMeetingForOrgMock.mockResolvedValue({
    ok: true,
    meetingId: MEETING_ID,
  });
  uploadMeetingTranscriptFileMock.mockResolvedValue({
    ok: true,
    transcript: ANALYZABLE_TEST_TRANSCRIPT,
    blobUrl: `https://blob.example/orgs/${ORG_ID}/meetings/transcripts/t.txt`,
  });
});

describe("coach shared phrases actions", () => {
  it("listCoachSharedPhrases rejects invalid kind", async () => {
    const result = await listCoachSharedPhrases("INVALID");
    expect(result).toEqual({ ok: false, message: "Type invalide." });
  });

  it("listCoachSharedPhrases returns builtins and community rows", async () => {
    onboardingSharedPhrasesMock.listByKind.mockResolvedValue([
      {
        id: "phrase_1",
        text: "Phrase communautaire unique",
        normalizedText: "phrase communautaire unique",
      },
    ]);
    const result = await listCoachSharedPhrases("OBJECTION");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.phrases.some((p) => p.source === "builtin")).toBe(true);
    expect(result.phrases.some((p) => p.id === "phrase_1")).toBe(true);
  });

  it("listCoachSharedPhrases skips community rows matching builtins", async () => {
    onboardingSharedPhrasesMock.listByKind.mockResolvedValue([
      {
        id: "dup",
        text: DEFAULT_OBJECTION_PHRASES[0],
        normalizedText: DEFAULT_OBJECTION_PHRASES[0].trim().toLowerCase(),
      },
    ]);
    const result = await listCoachSharedPhrases("OBJECTION");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.phrases.some((p) => p.id === "dup")).toBe(false);
  });

  it("createCoachSharedPhrase redirects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    await expect(
      createCoachSharedPhrase({ kind: "OBJECTION", text: "Nouvelle phrase" }),
    ).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("createCoachSharedPhrase validates input", async () => {
    const result = await createCoachSharedPhrase({
      kind: "OBJECTION",
      text: "ab",
    });
    expect(result.ok).toBe(false);
  });

  it("createCoachSharedPhrase rejects missing user", async () => {
    findByIdMock.mockResolvedValue(null);
    const result = await createCoachSharedPhrase({
      kind: "OBJECTION",
      text: "Phrase communautaire valide",
    });
    expect(result).toEqual({ ok: false, message: "Utilisateur introuvable." });
  });

  it("createCoachSharedPhrase rejects builtin duplicate", async () => {
    const result = await createCoachSharedPhrase({
      kind: "OBJECTION",
      text: DEFAULT_OBJECTION_PHRASES[0],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("liste intégrée");
  });

  it("createCoachSharedPhrase creates community phrase", async () => {
    onboardingSharedPhrasesMock.createPhrase.mockResolvedValue({
      id: "new_phrase",
      text: "Phrase communautaire valide",
    });
    const result = await createCoachSharedPhrase({
      kind: "ARGUMENT",
      text: "Phrase communautaire valide",
    });
    expect(result).toEqual({
      ok: true,
      phrase: {
        id: "new_phrase",
        text: "Phrase communautaire valide",
        source: "community",
      },
    });
  });

  it("createCoachSharedPhrase maps duplicate db error", async () => {
    onboardingSharedPhrasesMock.createPhrase.mockRejectedValue(
      new Error("duplicate"),
    );
    const result = await createCoachSharedPhrase({
      kind: "ARGUMENT",
      text: "Autre phrase communautaire",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("collection partagée");
  });

  it("createCoachSharedPhrase rejects phrase shorter than 3 chars after normalize", async () => {
    normalizePhraseKeyMock.mockReturnValue("ab");
    const result = await createCoachSharedPhrase({
      kind: "ARGUMENT",
      text: "valid length phrase",
    });
    expect(result).toEqual({ ok: false, message: "Phrase trop courte." });
  });
});

describe("search org action", () => {
  it("searchOrgAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    await expect(searchOrgAction("query")).resolves.toEqual({
      ok: false,
      error: "UNAUTHENTICATED",
    });
  });

  it("searchOrgAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    await expect(searchOrgAction("query")).resolves.toEqual({
      ok: false,
      error: "NO_ORG",
    });
  });

  it("searchOrgAction returns empty results for short query", async () => {
    const result = await searchOrgAction("a");
    expect(result).toEqual({
      ok: true,
      results: { meetings: [], contacts: [], members: [] },
    });
  });

  it("searchOrgAction searches entities for org admin", async () => {
    contactsMock.searchByPrefix.mockResolvedValue([
      { id: PERSON_ID, displayName: "Alice" },
    ]);
    organizationTeamMock.listMembersAndPendingInvitations.mockResolvedValue({
      members: [
        {
          userId: SELLER_ID,
          firstName: "Bob",
          lastName: "Seller",
          email: "bob@test.com",
        },
      ],
      pendingInvitations: [],
    });
    const result = await searchOrgAction("bo");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(contactsMock.searchByPrefix).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID, prefix: "bo" }),
    );
    expect(result.results.members.length).toBeGreaterThan(0);
  });
});

describe("prepare briefing action", () => {
  it("prepareBriefingAction validates input", async () => {
    const result = await prepareBriefingAction({
      personId: "bad-id",
      targetStage: "Discovery",
    });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("prepareBriefingAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await prepareBriefingAction({
      personId: PERSON_ID,
      targetStage: "Discovery",
    });
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("prepareBriefingAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await prepareBriefingAction({
      personId: PERSON_ID,
      targetStage: "Discovery",
    });
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("prepareBriefingAction returns not found when person missing", async () => {
    contactsMock.findById.mockResolvedValue(null);
    const result = await prepareBriefingAction({
      personId: PERSON_ID,
      targetStage: "Discovery",
    });
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("prepareBriefingAction returns briefing", async () => {
    contactsMock.findById.mockResolvedValue({
      id: PERSON_ID,
      displayName: "Alice Prospect",
      company: "Acme",
    });
    analysisMock.prepareMeetingBriefing.mockResolvedValue({
      result: "Briefing markdown",
    });
    const result = await prepareBriefingAction({
      personId: PERSON_ID,
      targetStage: "Closing",
    });
    expect(result).toEqual({
      ok: true,
      personName: "Alice Prospect",
      hasHistory: false,
      briefing: "Briefing markdown",
    });
  });
});

describe("contacts actions", () => {
  it("searchContactsPickerAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await searchContactsPickerAction("Al");
    expect(result).toEqual({
      ok: false,
      error: "UNAUTHENTICATED",
      items: [],
    });
  });

  it("searchContactsPickerAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await searchContactsPickerAction("Al");
    expect(result).toEqual({ ok: false, error: "NO_ORG", items: [] });
  });

  it("searchContactsPickerAction returns contacts", async () => {
    contactsMock.searchByPrefix.mockResolvedValue([
      { id: PERSON_ID, displayName: "Alice" },
    ]);
    const result = await searchContactsPickerAction("Al");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
  });

  it("createContactInlineAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await createContactInlineAction({ displayName: "Alice" });
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("createContactInlineAction validates display name", async () => {
    const result = await createContactInlineAction({ displayName: "   " });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("createContactInlineAction maps duplicate error", async () => {
    contactsMock.create.mockRejectedValue(prismaUniqueError());
    const result = await createContactInlineAction({
      displayName: "Alice",
      company: "Acme",
    });
    expect(result).toEqual({ ok: false, error: "DUPLICATE" });
  });

  it("createContactInlineAction rethrows unexpected errors", async () => {
    contactsMock.create.mockRejectedValue(new Error("db down"));
    await expect(
      createContactInlineAction({ displayName: "Alice" }),
    ).rejects.toThrow("db down");
  });

  it("createContactInlineAction creates contact and revalidates", async () => {
    contactsMock.create.mockResolvedValue({
      id: PERSON_ID,
      displayName: "Alice",
    });
    const result = await createContactInlineAction({
      displayName: "Alice",
      company: "Acme",
    });
    expect(result).toEqual({
      ok: true,
      personId: PERSON_ID,
      displayName: "Alice",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/contacts");
  });

  it("createContactAction validates display name", async () => {
    const result = await createContactAction({ displayName: "   " });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("createContactAction rethrows unexpected errors", async () => {
    contactsMock.create.mockRejectedValue(new Error("db down"));
    await expect(
      createContactAction({ displayName: "Alice" }),
    ).rejects.toThrow("db down");
  });

  it("createContactAction creates full contact", async () => {
    contactsMock.create.mockResolvedValue({ id: PERSON_ID });
    const result = await createContactAction({
      displayName: "Alice",
      company: "Acme",
      email: "alice@acme.com",
      phone: "0102030405",
      jobTitle: "CEO",
      notes: "VIP",
    });
    expect(result).toEqual({ ok: true, id: PERSON_ID });
  });

  it("createContactAction maps duplicate error", async () => {
    contactsMock.create.mockRejectedValue(prismaUniqueError());
    const result = await createContactAction({
      displayName: "Alice",
      email: "alice@acme.com",
    });
    expect(result).toEqual({ ok: false, error: "DUPLICATE" });
  });

  it("updateContactAction validates contact id", async () => {
    const result = await updateContactAction("bad", { displayName: "Alice" });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("updateContactAction validates payload", async () => {
    const result = await updateContactAction(PERSON_ID, { displayName: "  " });
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("updateContactAction returns not found", async () => {
    contactsMock.update.mockResolvedValue(null);
    const result = await updateContactAction(PERSON_ID, {
      displayName: "Alice",
    });
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("updateContactAction updates contact", async () => {
    contactsMock.update.mockResolvedValue({ id: PERSON_ID });
    const result = await updateContactAction(PERSON_ID, {
      displayName: "Alice Updated",
      email: "",
    });
    expect(result).toEqual({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/company/contacts/${PERSON_ID}`,
    );
  });

  it("deleteContactAction validates contact id", async () => {
    const result = await deleteContactAction("bad");
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("deleteContactAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await deleteContactAction(PERSON_ID);
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("deleteContactAction returns not found", async () => {
    contactsMock.deleteByIdForOrg.mockResolvedValue("not_found");
    const result = await deleteContactAction(PERSON_ID);
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("deleteContactAction blocks delete when meetings are linked", async () => {
    contactsMock.deleteByIdForOrg.mockResolvedValue("has_meetings");
    const result = await deleteContactAction(PERSON_ID);
    expect(result).toEqual({ ok: false, error: "HAS_MEETINGS" });
  });

  it("deleteContactAction deletes contact", async () => {
    contactsMock.deleteByIdForOrg.mockResolvedValue("deleted");
    const result = await deleteContactAction(PERSON_ID);
    expect(result).toEqual({ ok: true });
    expect(contactsMock.deleteByIdForOrg).toHaveBeenCalledWith({
      id: PERSON_ID,
      organizationId: ORG_ID,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/contacts");
  });
});

describe("equipe actions", () => {
  function mockManagerMembership() {
    organizationTeamMock.findMembershipForManagerView.mockResolvedValue({
      user: {
        firstName: "Bob",
        lastName: "Seller",
        email: "bob@test.com",
      },
    });
  }

  it("getTeamMemberPerformanceFingerprintAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await getTeamMemberPerformanceFingerprintAction(
      SELLER_ID,
      30,
    );
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("getTeamMemberPerformanceFingerprintAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await getTeamMemberPerformanceFingerprintAction(
      SELLER_ID,
      30,
    );
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("getTeamMemberPerformanceFingerprintAction forbids non-managers", async () => {
    mockOrgMemberPrincipal();
    const result = await getTeamMemberPerformanceFingerprintAction(
      SELLER_ID,
      30,
    );
    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("getTeamMemberPerformanceFingerprintAction validates user id", async () => {
    const result = await getTeamMemberPerformanceFingerprintAction("bad", 30);
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("getTeamMemberPerformanceFingerprintAction returns not found", async () => {
    organizationTeamMock.findMembershipForManagerView.mockResolvedValue(null);
    const result = await getTeamMemberPerformanceFingerprintAction(
      SELLER_ID,
      30,
    );
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("getTeamMemberPerformanceFingerprintAction returns fingerprint", async () => {
    mockManagerMembership();
    meetingsMock.listRecentMeetingsForDashboard.mockResolvedValue([
      {
        id: MEETING_ID,
        status: "READY",
        meetingAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await getTeamMemberPerformanceFingerprintAction(
      SELLER_ID,
      30,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meetingCount).toBe(1);
    expect(typeof result.fingerprint).toBe("string");
  });

  it("refreshTeamMemberPerformanceAction returns profile", async () => {
    mockManagerMembership();
    const result = await refreshTeamMemberPerformanceAction(SELLER_ID, 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.performanceForces).toBe("Forces");
    expect(getTeamMemberPerformanceProfileMock).toHaveBeenCalled();
  });
});

describe("rendez-vous actions", () => {
  it("getOrgMeetingFormOptionsAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await getOrgMeetingFormOptionsAction();
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("getOrgMeetingFormOptionsAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await getOrgMeetingFormOptionsAction();
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("getOrgMeetingFormOptionsAction returns defaults", async () => {
    const result = await getOrgMeetingFormOptionsAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meetingTypeOptions.length).toBeGreaterThan(0);
    expect(result.pipelineStageOptions.length).toBeGreaterThan(0);
  });

  it("deleteMeetingAction validates meeting id", async () => {
    const result = await deleteMeetingAction("bad-id");
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("deleteMeetingAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const result = await deleteMeetingAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("deleteMeetingAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await deleteMeetingAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("deleteMeetingAction returns not found", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue(null);
    const result = await deleteMeetingAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("deleteMeetingAction forbids deleting another seller meeting", async () => {
    mockOrgMemberPrincipal();
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: SELLER_ID,
    });
    const result = await deleteMeetingAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("deleteMeetingAction deletes meeting for owner", async () => {
    mockOrgMemberPrincipal();
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
    });
    const result = await deleteMeetingAction(MEETING_ID);
    expect(result).toEqual({ ok: true, sellerUserId: USER_ID });
    expect(meetingsMock.deleteMeetingByIdForOrg).toHaveBeenCalledWith({
      id: MEETING_ID,
      organizationId: ORG_ID,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/rendez-vous");
  });

  it("deleteMeetingAction allows admin to delete any meeting", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: SELLER_ID,
    });
    const result = await deleteMeetingAction(MEETING_ID);
    expect(result).toEqual({ ok: true, sellerUserId: SELLER_ID });
  });

  it("createMeetingAction rejects invalid form fields", async () => {
    const result = await createMeetingAction(
      meetingFormData({ outcome: "NOT_AN_OUTCOME" }),
    );
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("createMeetingAction rejects foreign transcript blob url", async () => {
    uploadMeetingTranscriptFileMock.mockResolvedValue({
      ok: true,
      transcript: ANALYZABLE_TEST_TRANSCRIPT,
      blobUrl: "https://blob.example/orgs/other-org/meetings/x.txt",
    });
    (blobUrlBelongsToOrg as JestFn).mockReturnValueOnce(false);
    const fd = meetingFormData({ transcript: "" });
    fd.set("transcriptFile", new File(["x"], "notes.txt", { type: "text/plain" }));
    const result = await createMeetingAction(fd);
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("createMeetingAction creates meeting from uploaded transcript file", async () => {
    const fd = meetingFormData({ transcript: "" });
    fd.set("transcriptFile", new File(["hello"], "notes.txt", { type: "text/plain" }));
    const result = await createMeetingAction(fd);
    expect(result.ok).toBe(true);
    expect(createMeetingForOrgMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sourceType: "UPLOAD" }),
    );
  });

  it("createMeetingAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await createMeetingAction(meetingFormData());
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("createMeetingAction rejects transcript upload failure", async () => {
    uploadMeetingTranscriptFileMock.mockResolvedValue({
      ok: false,
      error: "UNSUPPORTED",
    });
    const fd = meetingFormData({ transcript: "" });
    fd.set("transcriptFile", new File(["x"], "notes.txt", { type: "text/plain" }));
    const result = await createMeetingAction(fd);
    expect(result).toEqual({ ok: false, error: "UNSUPPORTED" });
  });

  it("createMeetingAction rejects invalid person", async () => {
    createMeetingForOrgMock.mockResolvedValue({
      ok: false,
      error: "INVALID_PERSON",
    });
    const result = await createMeetingAction(meetingFormData());
    expect(result).toEqual({ ok: false, error: "INVALID_PERSON" });
  });

  it("createMeetingAction rejects empty transcript", async () => {
    const result = await createMeetingAction(
      meetingFormData({ transcript: "   " }),
    );
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("createMeetingAction rejects transcript too short for analysis", async () => {
    const result = await createMeetingAction(
      meetingFormData({ transcript: "Trop court pour analyse." }),
    );
    expect(result).toEqual({
      ok: false,
      error: "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS",
    });
  });

  it("createMeetingAction creates meeting", async () => {
    const result = await createMeetingAction(meetingFormData());
    expect(result).toEqual({
      ok: true,
      meetingId: MEETING_ID,
      sellerUserId: USER_ID,
    });
    expect(createMeetingForOrgMock).toHaveBeenCalled();
    expect(scheduleAnalysisJobsAfterResponseMock).toHaveBeenCalled();
    expect(revalidateTeamMemberPerformancePathsMock).toHaveBeenCalledWith(
      USER_ID,
    );
  });

  it("createMeetingAction maps quota exhausted", async () => {
    createMeetingForOrgMock.mockResolvedValue({
      ok: false,
      error: "QUOTA_EXHAUSTED",
    });
    const result = await createMeetingAction(meetingFormData());
    expect(result).toEqual({ ok: false, error: "QUOTA_EXHAUSTED" });
  });

  it("getMeetingForEditAction validates meeting id", async () => {
    const result = await getMeetingForEditAction("bad");
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("getMeetingForEditAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const result = await getMeetingForEditAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("getMeetingForEditAction returns meeting payload", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date("2026-06-22T10:00:00.000Z"),
      durationMin: 30,
      meetingType: "Discovery",
      pipelineStage: "Qualif",
      potentialAmount: 1000,
      outcome: "FOLLOW_UP",
      feeling: 4,
      transcript: "Hello",
      notes: null,
      sellerUserId: USER_ID,
    });
    const result = await getMeetingForEditAction(MEETING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.meeting.prospectName).toBe("Alice");
  });

  it("getMeetingForEditAction forbids non-owner member", async () => {
    mockOrgMemberPrincipal();
    mockAuthenticatedActorContext(false);
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: SELLER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "x",
      notes: null,
    });
    const result = await getMeetingForEditAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("updateMeetingAction rejects transcript upload failure", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "Old transcript",
      notes: null,
    });
    uploadMeetingTranscriptFileMock.mockResolvedValue({
      ok: false,
      error: "UNSUPPORTED",
    });
    const fd = meetingFormData({ meetingId: MEETING_ID, transcript: "" });
    fd.set("transcriptFile", new File(["x"], "notes.txt", { type: "text/plain" }));
    const result = await updateMeetingAction(fd);
    expect(result).toEqual({ ok: false, error: "UNSUPPORTED" });
  });

  it("updateMeetingAction rejects invalid form fields", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "Old transcript",
      notes: null,
    });
    const result = await updateMeetingAction(
      meetingFormData({ meetingId: MEETING_ID, outcome: "NOT_VALID" }),
    );
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("updateMeetingAction rejects foreign transcript blob url", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "Old transcript",
      notes: null,
    });
    uploadMeetingTranscriptFileMock.mockResolvedValue({
      ok: true,
      transcript: ANALYZABLE_TEST_TRANSCRIPT,
      blobUrl: "https://blob.example/orgs/other-org/meetings/x.txt",
    });
    (blobUrlBelongsToOrg as JestFn).mockReturnValueOnce(false);
    const fd = meetingFormData({ meetingId: MEETING_ID, transcript: "" });
    fd.set("transcriptFile", new File(["x"], "notes.txt", { type: "text/plain" }));
    const result = await updateMeetingAction(fd);
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("updateMeetingAction rejects empty merged transcript", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "   ",
      notes: null,
    });
    const result = await updateMeetingAction(
      meetingFormData({ meetingId: MEETING_ID, transcript: "   " }),
    );
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("updateMeetingAction maps invalid person to INVALID_PERSON", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "Old transcript",
      notes: null,
    });
    updateMeetingForOrgMock.mockResolvedValue({
      ok: false,
      error: "INVALID_PERSON",
    });
    const result = await updateMeetingAction(
      meetingFormData({ meetingId: MEETING_ID }),
    );
    expect(result).toEqual({ ok: false, error: "INVALID_PERSON" });
  });

  it("updateMeetingAction rejects missing org", async () => {
    mockNoOrgPrincipal();
    const fd = meetingFormData({ meetingId: MEETING_ID });
    const result = await updateMeetingAction(fd);
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("updateMeetingAction rejects invalid meeting id", async () => {
    const result = await updateMeetingAction(meetingFormData({ meetingId: "bad" }));
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("updateMeetingAction returns not found", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue(null);
    const result = await updateMeetingAction(
      meetingFormData({ meetingId: MEETING_ID }),
    );
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("updateMeetingAction maps update failure to NOT_FOUND", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "Old transcript",
      notes: null,
    });
    updateMeetingForOrgMock.mockResolvedValue({
      ok: false,
      error: "NOT_FOUND",
    });
    const result = await updateMeetingAction(
      meetingFormData({ meetingId: MEETING_ID }),
    );
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("updateMeetingAction updates meeting and enqueues analysis when transcript changes", async () => {
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: USER_ID,
      personId: PERSON_ID,
      prospectName: "Alice",
      meetingAt: new Date(),
      durationMin: null,
      meetingType: null,
      pipelineStage: null,
      potentialAmount: null,
      outcome: "OTHER",
      feeling: null,
      transcript: "Old transcript",
      notes: null,
    });
    organizationQuotaMock.getTrialAnalysesLeft.mockResolvedValue(2);
    const result = await updateMeetingAction(
      meetingFormData({ meetingId: MEETING_ID, transcript: ANALYZABLE_TEST_TRANSCRIPT }),
    );
    expect(result).toEqual({
      ok: true,
      meetingId: MEETING_ID,
      sellerUserId: USER_ID,
    });
    expect(analysisJobsMock.enqueueMeetingAnalysis).toHaveBeenCalled();
    expect(scheduleAnalysisJobsAfterResponseMock).toHaveBeenCalled();
  });
});

describe("meeting detail actions", () => {
  it("runAllMeetingAnalysesAction validates meeting id", async () => {
    const result = await runAllMeetingAnalysesAction("bad-id");
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
    expect(requireAnalysisActorMock).not.toHaveBeenCalled();
  });

  it("runAllMeetingAnalysesAction returns actor error", async () => {
    requireAnalysisActorMock.mockResolvedValue({
      ok: false,
      error: "UNAUTHENTICATED",
    });
    const result = await runAllMeetingAnalysesAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "UNAUTHENTICATED" });
  });

  it("runAllMeetingAnalysesAction propagates analysis failure", async () => {
    runAllMeetingAnalysesForOrgMock.mockResolvedValue({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
      failedKind: "SONCAS",
    });
    const result = await runAllMeetingAnalysesAction(MEETING_ID);
    expect(result).toEqual({
      ok: false,
      error: "ANALYSIS_FAILED",
      message: "boom",
      failedKind: "SONCAS",
    });
  });

  it("runAllMeetingAnalysesAction runs analyses and revalidates", async () => {
    const result = await runAllMeetingAnalysesAction(MEETING_ID);
    expect(result).toEqual({ ok: true });
    expect(runAllMeetingAnalysesForOrgMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: ORG_ID,
        meetingId: MEETING_ID,
        notifyOnComplete: false,
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/company/rendez-vous/${MEETING_ID}`,
    );
  });

  it("runAllMeetingAnalysesAction forbids non-seller member", async () => {
    mockOrgMemberPrincipal();
    mockAnalysisActor({}, { canManageOrganization: false });
    meetingsMock.findMeetingByIdForOrg.mockResolvedValue({
      id: MEETING_ID,
      sellerUserId: SELLER_ID,
    });
    const result = await runAllMeetingAnalysesAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
    expect(runAllMeetingAnalysesForOrgMock).not.toHaveBeenCalled();
  });

  it("generateFollowUpEmailAction validates meeting id", async () => {
    const result = await generateFollowUpEmailAction("bad-id");
    expect(result).toEqual({ ok: false, error: "VALIDATION" });
  });

  it("generateFollowUpEmailAction returns actor error", async () => {
    requireAnalysisActorMock.mockResolvedValue({
      ok: false,
      error: "NO_ORG",
    });
    const result = await generateFollowUpEmailAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "NO_ORG" });
  });

  it("generateFollowUpEmailAction returns not found", async () => {
    meetingsMock.findMeetingDetailWithAnalyses.mockResolvedValue(null);
    const result = await generateFollowUpEmailAction(MEETING_ID);
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("generateFollowUpEmailAction generates draft and revalidates", async () => {
    meetingsMock.findMeetingDetailWithAnalyses.mockResolvedValue({
      sellerUserId: USER_ID,
    });
    generateFollowUpEmailForMeetingMock.mockResolvedValue({
      subject: "Follow up",
      greeting: "Hello",
      bodyParagraphs: ["Thanks"],
      closing: "Regards",
    });
    const result = await generateFollowUpEmailAction(MEETING_ID);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.subject).toBe("Follow up");
    expect(meetingsMock.updateMeetingFollowUpDraft).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/company/rendez-vous/${MEETING_ID}`,
    );
  });

  it("generateFollowUpEmailAction maps generation failure", async () => {
    meetingsMock.findMeetingDetailWithAnalyses.mockResolvedValue({
      sellerUserId: USER_ID,
    });
    generateFollowUpEmailForMeetingMock.mockRejectedValue(
      new Error("model failed"),
    );
    const result = await generateFollowUpEmailAction(MEETING_ID);
    expect(result).toEqual({
      ok: false,
      error: "FAILED",
      message: "model failed",
    });
  });
});
