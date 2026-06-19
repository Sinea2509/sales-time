import { describe, expect, it } from "@jest/globals";
import { GLOBAL_PROMPT_AUDIT_ORG_ID } from "@/src/core/domain/global-audit-ids";
import { publishGlobalPromptVersion } from "./publish-global-prompt-version";

describe("publishGlobalPromptVersion", () => {
  it("rejects when actor id is missing", async () => {
    const prompts = {
      getCurrentVersion: jest.fn(),
      ensureCurrentVersion: jest.fn(),
      listVersions: jest.fn(),
      publishNewVersion: jest.fn(),
    };
    const audit = { logSuperAdminAction: jest.fn() };

    const result = await publishGlobalPromptVersion(
      { prompts, audit },
      {
        actorInternalUserId: null,
        isSuperAdmin: true,
        kind: "SONCAS",
        markdown: "# x",
        auditAction: "PUBLISH_PROMPT",
      },
    );

    expect(result).toEqual({ ok: false, error: "USER_NOT_SYNCED" });
    expect(prompts.publishNewVersion).not.toHaveBeenCalled();
  });

  it("rejects non–super admin", async () => {
    const prompts = {
      getCurrentVersion: jest.fn(),
      ensureCurrentVersion: jest.fn(),
      listVersions: jest.fn(),
      publishNewVersion: jest.fn(),
    };
    const audit = { logSuperAdminAction: jest.fn() };

    const result = await publishGlobalPromptVersion(
      { prompts, audit },
      {
        actorInternalUserId: "u1",
        isSuperAdmin: false,
        kind: "SONCAS",
        markdown: "# x",
        auditAction: "PUBLISH_PROMPT",
      },
    );

    expect(result).toEqual({ ok: false, error: "NOT_SUPER_ADMIN" });
    expect(prompts.publishNewVersion).not.toHaveBeenCalled();
  });

  it("publishes version and audits", async () => {
    const prompts = {
      getCurrentVersion: jest.fn(),
      ensureCurrentVersion: jest.fn(),
      listVersions: jest.fn(),
      publishNewVersion: jest.fn().mockResolvedValue({
        id: "v2",
        templateId: "t1",
        kind: "SONCAS" as const,
        version: 2,
        markdown: "# body",
        authorUserId: "u1",
        createdAt: new Date(),
      }),
    };
    const audit = { logSuperAdminAction: jest.fn().mockResolvedValue(undefined) };

    const result = await publishGlobalPromptVersion(
      { prompts, audit },
      {
        actorInternalUserId: "u1",
        isSuperAdmin: true,
        kind: "SONCAS",
        markdown: "# body",
        auditAction: "RESTORE_PROMPT",
      },
    );

    expect(result).toEqual({ ok: true, version: 2 });
    expect(prompts.publishNewVersion).toHaveBeenCalledWith({
      kind: "SONCAS",
      markdown: "# body",
      authorUserId: "u1",
    });
    expect(audit.logSuperAdminAction).toHaveBeenCalledWith({
      actorInternalUserId: "u1",
      organizationId: GLOBAL_PROMPT_AUDIT_ORG_ID,
      action: "RESTORE_PROMPT",
      reason: "SONCAS prompt v2",
    });
  });
});
