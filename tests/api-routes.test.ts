import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- route test mocks
type JestFn = jest.Mock<any>;

const ORG_ID = "org_1";
const USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";
const BLOB_URL =
  "https://store.public.blob.vercel-storage.com/orgs/org_1/feedbacks/a.png";

const originalEnv = process.env;

// eslint-disable-next-line no-var
var clearSessionCookieMock: JestFn;
// eslint-disable-next-line no-var
var clearActiveOrganizationCookieMock: JestFn;
jest.mock("@/lib/auth/session-cookie", () => {
  clearSessionCookieMock = jest.fn();
  clearActiveOrganizationCookieMock = jest.fn();
  return {
    clearSessionCookie: (...args: unknown[]) => clearSessionCookieMock(...args),
    clearActiveOrganizationCookie: (...args: unknown[]) =>
      clearActiveOrganizationCookieMock(...args),
  };
});

// eslint-disable-next-line no-var
var purgeRetentionDataMock: JestFn;
jest.mock("@/src/core/application/purge-retention-data", () => {
  purgeRetentionDataMock = jest.fn();
  return {
    purgeRetentionData: (...args: unknown[]) => purgeRetentionDataMock(...args),
  };
});

// eslint-disable-next-line no-var
var processAnalysisJobsMock: JestFn;
jest.mock("@/src/core/application/process-analysis-jobs", () => {
  processAnalysisJobsMock = jest.fn();
  return {
    processAnalysisJobs: (...args: unknown[]) => processAnalysisJobsMock(...args),
  };
});

// eslint-disable-next-line no-var
var getAuthenticatedPrincipalMock: JestFn;
// eslint-disable-next-line no-var
var readSuperAdminOrgCookieMock: JestFn;
// eslint-disable-next-line no-var
var getCurrentActorContextMock: JestFn;
// eslint-disable-next-line no-var
var fetchBlobBytesMock: JestFn;
// eslint-disable-next-line no-var
var putBlobMock: JestFn;

jest.mock("@/lib/application-deps", () => {
  getAuthenticatedPrincipalMock = jest.fn();
  return {
    getApplicationDeps: () => ({
      auth: {
        getAuthenticatedPrincipal: (...args: unknown[]) =>
          getAuthenticatedPrincipalMock(...args),
      },
    }),
  };
});

jest.mock("@/lib/read-super-admin-org-cookie", () => {
  readSuperAdminOrgCookieMock = jest.fn();
  return {
    readSuperAdminOrgCookie: (...args: unknown[]) =>
      readSuperAdminOrgCookieMock(...args),
  };
});

jest.mock("@/src/core/application/get-current-actor-context", () => {
  getCurrentActorContextMock = jest.fn();
  return {
    getCurrentActorContext: (...args: unknown[]) =>
      getCurrentActorContextMock(...args),
  };
});

jest.mock("@/lib/blob-access", () => {
  fetchBlobBytesMock = jest.fn();
  const actual = jest.requireActual<typeof import("@/lib/blob-access")>(
    "@/lib/blob-access",
  );
  return {
    ...actual,
    fetchBlobBytes: (...args: unknown[]) => fetchBlobBytesMock(...args),
  };
});

jest.mock("@vercel/blob", () => {
  putBlobMock = jest.fn();
  return {
    put: (...args: unknown[]) => putBlobMock(...args),
  };
});

// eslint-disable-next-line no-var
var checkAiGatewayConfiguredMock: JestFn;
jest.mock("@/lib/env", () => {
  checkAiGatewayConfiguredMock = jest.fn();
  return {
    checkAiGatewayConfigured: (...args: unknown[]) =>
      checkAiGatewayConfiguredMock(...args),
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("POST /[locale]/sign-out", () => {
  let POST: typeof import("@/app/[locale]/sign-out/route").POST;

  beforeAll(async () => {
    ({ POST } = await import("@/app/[locale]/sign-out/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearSessionCookieMock.mockResolvedValue(undefined);
    clearActiveOrganizationCookieMock.mockResolvedValue(undefined);
  });

  it("clears session cookies and redirects to sign-in", async () => {
    const response = await POST(
      new Request("http://localhost/fr/sign-out", { method: "POST" }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/sign-in");
    expect(clearSessionCookieMock).toHaveBeenCalled();
    expect(clearActiveOrganizationCookieMock).toHaveBeenCalled();
  });
});

describe("GET /api/cron/purge-retention", () => {
  let GET: typeof import("@/app/api/cron/purge-retention/route").GET;

  beforeAll(async () => {
    ({ GET } = await import("@/app/api/cron/purge-retention/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    purgeRetentionDataMock.mockResolvedValue({ purged: 2 });
    process.env = { ...originalEnv, NODE_ENV: "development" };
    delete process.env.CRON_SECRET;
  });

  it("rejects unauthorized cron requests in production", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.CRON_SECRET;
    const response = await GET(new Request("http://localhost/api/cron/purge-retention"));
    expect(response.status).toBe(401);
    expect(purgeRetentionDataMock).not.toHaveBeenCalled();
  });

  it("purges retention data when authorized", async () => {
    const response = await GET(new Request("http://localhost/api/cron/purge-retention"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, purged: 2 });
    expect(purgeRetentionDataMock).toHaveBeenCalled();
  });
});

describe("GET /api/worker/process-jobs", () => {
  let GET: typeof import("@/app/api/worker/process-jobs/route").GET;

  beforeAll(async () => {
    ({ GET } = await import("@/app/api/worker/process-jobs/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    processAnalysisJobsMock.mockResolvedValue({ processed: 1 });
    checkAiGatewayConfiguredMock.mockReturnValue({ ok: true, apiKey: "gw-test" });
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      AI_GATEWAY_API_KEY: "gw-test",
    };
    delete process.env.CRON_SECRET;
  });

  it("rejects unauthorized worker requests in production", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      AI_GATEWAY_API_KEY: "gw-test",
    };
    delete process.env.CRON_SECRET;
    const response = await GET(new Request("http://localhost/api/worker/process-jobs"));
    expect(response.status).toBe(401);
    expect(processAnalysisJobsMock).not.toHaveBeenCalled();
  });

  it("returns 503 when AI gateway is not configured", async () => {
    checkAiGatewayConfiguredMock.mockReturnValue({
      ok: false,
      error: "AI_NOT_CONFIGURED",
    });
    const response = await GET(new Request("http://localhost/api/worker/process-jobs"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "AI_NOT_CONFIGURED",
    });
    expect(processAnalysisJobsMock).not.toHaveBeenCalled();
  });

  it("processes analysis jobs when authorized", async () => {
    const response = await GET(new Request("http://localhost/api/worker/process-jobs"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, processed: 1 });
    expect(processAnalysisJobsMock).toHaveBeenCalled();
  });
});

describe("GET /api/org-blob", () => {
  let GET: typeof import("@/app/api/org-blob/route").GET;

  beforeAll(async () => {
    ({ GET } = await import("@/app/api/org-blob/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    readSuperAdminOrgCookieMock.mockResolvedValue(null);
  });

  function mockMemberAccess() {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      email: "user@test.com",
      memberships: [{ organizationId: ORG_ID, role: "MEMBER" }],
    });
    getCurrentActorContextMock.mockResolvedValue({
      kind: "authenticated",
      userId: USER_ID,
      email: "user@test.com",
      activeOrganizationId: ORG_ID,
      systemRoles: [],
    });
  }

  it("returns 400 for invalid query", async () => {
    const response = await GET(new Request("http://localhost/api/org-blob?url=not-a-url"));
    expect(response.status).toBe(400);
  });

  it("returns 403 when blob pathname cannot be resolved", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/org-blob?url=${encodeURIComponent("http://example.com")}`,
      ),
    );
    expect(response.status).toBe(403);
  });

  it("returns 401 when principal is missing", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const response = await GET(
      new Request(`http://localhost/api/org-blob?url=${encodeURIComponent(BLOB_URL)}`),
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when actor context is not authenticated", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      memberships: [{ organizationId: ORG_ID, role: "MEMBER" }],
    });
    getCurrentActorContextMock.mockResolvedValue({ kind: "anonymous" });
    const response = await GET(
      new Request(`http://localhost/api/org-blob?url=${encodeURIComponent(BLOB_URL)}`),
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when user cannot access blob", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      memberships: [{ organizationId: "other_org", role: "MEMBER" }],
    });
    getCurrentActorContextMock.mockResolvedValue({
      kind: "authenticated",
      userId: USER_ID,
      email: "user@test.com",
      activeOrganizationId: "other_org",
      systemRoles: [],
    });
    const response = await GET(
      new Request(`http://localhost/api/org-blob?url=${encodeURIComponent(BLOB_URL)}`),
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when blob bytes are missing", async () => {
    mockMemberAccess();
    fetchBlobBytesMock.mockResolvedValue(null);
    const response = await GET(
      new Request(`http://localhost/api/org-blob?url=${encodeURIComponent(BLOB_URL)}`),
    );
    expect(response.status).toBe(404);
  });

  it("returns blob bytes when access is allowed", async () => {
    mockMemberAccess();
    fetchBlobBytesMock.mockResolvedValue({
      bytes: Buffer.from("png-bytes"),
      contentType: "image/png",
    });
    const response = await GET(
      new Request(`http://localhost/api/org-blob?url=${encodeURIComponent(BLOB_URL)}`),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.arrayBuffer()).resolves.toEqual(
      Buffer.from("png-bytes").buffer,
    );
  });
});

describe("POST /api/feedback/screenshot", () => {
  let POST: typeof import("@/app/api/feedback/screenshot/route").POST;

  beforeAll(async () => {
    ({ POST } = await import("@/app/api/feedback/screenshot/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    readSuperAdminOrgCookieMock.mockResolvedValue(null);
    putBlobMock.mockResolvedValue({ url: "https://blob.example/shot.png" });
    process.env = { ...originalEnv, BLOB_READ_WRITE_TOKEN: "blob-token" };
  });

  function mockOrgMember() {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      email: "user@test.com",
      memberships: [{ organizationId: ORG_ID, role: "MEMBER" }],
    });
    getCurrentActorContextMock.mockResolvedValue({
      kind: "authenticated",
      userId: USER_ID,
      email: "user@test.com",
      activeOrganizationId: ORG_ID,
      systemRoles: [],
    });
  }

  it("returns 401 when principal is missing", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/feedback/screenshot", { method: "POST" }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when active organization is missing", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      memberships: [{ organizationId: ORG_ID, role: "MEMBER" }],
    });
    getCurrentActorContextMock.mockResolvedValue({
      kind: "authenticated",
      userId: USER_ID,
      email: "user@test.com",
      activeOrganizationId: null,
      systemRoles: [],
    });
    const response = await POST(
      new Request("http://localhost/api/feedback/screenshot", { method: "POST" }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when file is missing", async () => {
    mockOrgMember();
    const response = await POST(
      new Request("http://localhost/api/feedback/screenshot", {
        method: "POST",
        body: new FormData(),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 503 when blob storage is not configured", async () => {
    mockOrgMember();
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    const form = new FormData();
    form.set("file", new File(["x"], "shot.png", { type: "image/png" }));
    const response = await POST(
      new Request("http://localhost/api/feedback/screenshot", {
        method: "POST",
        body: form,
      }),
    );
    expect(response.status).toBe(503);
  });

  it("uploads screenshot and returns blob url", async () => {
    mockOrgMember();
    const form = new FormData();
    form.set("file", new File(["x"], "shot.png", { type: "image/png" }));
    const response = await POST(
      new Request("http://localhost/api/feedback/screenshot", {
        method: "POST",
        body: form,
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://blob.example/shot.png",
    });
    expect(putBlobMock).toHaveBeenCalled();
  });
});
