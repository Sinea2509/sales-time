import {
  buildSignInRedirectPath,
  getAuthSessionVersion,
  isSessionVersionCurrent,
} from "@/lib/auth/session-version";

describe("getAuthSessionVersion", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.AUTH_SESSION_VERSION;
    delete process.env.NEXT_PUBLIC_COMMIT_SHA;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
  });

  afterAll(() => {
    process.env = env;
  });

  it("prefers AUTH_SESSION_VERSION when set", () => {
    process.env.AUTH_SESSION_VERSION = "release-42";
    process.env.NEXT_PUBLIC_COMMIT_SHA = "abc123";
    expect(getAuthSessionVersion()).toBe("release-42");
  });

  it("falls back to NEXT_PUBLIC_COMMIT_SHA", () => {
    process.env.NEXT_PUBLIC_COMMIT_SHA = "abc123";
    expect(getAuthSessionVersion()).toBe("abc123");
  });

  it("falls back to VERCEL_GIT_COMMIT_SHA", () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "def456";
    expect(getAuthSessionVersion()).toBe("def456");
  });

  it("defaults to dev when unset", () => {
    expect(getAuthSessionVersion()).toBe("dev");
  });
});

describe("isSessionVersionCurrent", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    process.env.AUTH_SESSION_VERSION = "v1";
  });

  afterAll(() => {
    process.env = env;
  });

  it("returns false when stored version is missing", () => {
    expect(isSessionVersionCurrent(undefined)).toBe(false);
  });

  it("returns false when stored version differs", () => {
    expect(isSessionVersionCurrent("v0")).toBe(false);
  });

  it("returns true when stored version matches", () => {
    expect(isSessionVersionCurrent("v1")).toBe(true);
  });
});

describe("buildSignInRedirectPath", () => {
  it("includes next and reason query params", () => {
    expect(
      buildSignInRedirectPath("/company/meetings?tab=1", "new_version"),
    ).toBe("/sign-in?next=%2Fcompany%2Fmeetings%3Ftab%3D1&reason=new_version");
  });

  it("omits query when return path is empty", () => {
    expect(buildSignInRedirectPath("")).toBe("/sign-in");
  });
});
