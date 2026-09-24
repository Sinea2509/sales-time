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

  it("nomme les deux actions des consignes d'organisation", () => {
    expect(PLATFORM_AUDIT_ACTIONS).toContain("ORG_PROMPT_UPDATED");
    expect(PLATFORM_AUDIT_ACTIONS).toContain("ORG_PROMPT_RESET");
    expect(PLATFORM_AUDIT_ACTION_LABELS.ORG_PROMPT_UPDATED).toBe(
      "Consigne d'organisation modifiée",
    );
    expect(PLATFORM_AUDIT_ACTION_LABELS.ORG_PROMPT_RESET).toBe(
      "Consigne d'organisation réinitialisée",
    );
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
