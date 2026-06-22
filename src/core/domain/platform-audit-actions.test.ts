import { describe, expect, it } from "@jest/globals";
import {
  GLOBAL_AUDIT_ORG_ID,
  PLATFORM_AUDIT_ACTIONS,
  PLATFORM_AUDIT_ACTION_LABELS,
  resolveAuditOrganizationLabel,
  SYSTEM_AUDIT_ORG_ID,
} from "./platform-audit-actions";

describe("platform-audit-actions", () => {
  it("exposes canonical audit action codes", () => {
    expect(PLATFORM_AUDIT_ACTIONS).toContain("CREATE_MEETING");
    expect(PLATFORM_AUDIT_ACTION_LABELS.CREATE_MEETING).toBe("Créer rendez-vous");
  });

  it("resolves system and global organization labels", () => {
    expect(resolveAuditOrganizationLabel(SYSTEM_AUDIT_ORG_ID, null)).toBe(
      "Système",
    );
    expect(resolveAuditOrganizationLabel(GLOBAL_AUDIT_ORG_ID, null)).toBe(
      "Plateforme (global)",
    );
  });

  it("prefers organization name over id", () => {
    expect(resolveAuditOrganizationLabel("org_1", "Acme")).toBe("Acme");
    expect(resolveAuditOrganizationLabel("org_1", null)).toBe("org_1");
  });
});
