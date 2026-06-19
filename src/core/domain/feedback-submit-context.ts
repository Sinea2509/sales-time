import type { ActorContext } from "./actor-context";
import type { OrganizationMembershipRole } from "./organization-membership-role";
import { organizationMembershipRoleLabel } from "./organization-membership-role";
import type { SystemRoleType } from "./system-role-type";
import type { WorkspaceRoleMode } from "./authorization-policy";

export type FeedbackSubmitContextExtra = {
  organizationId: string | null;
  workspaceRoleMode: WorkspaceRoleMode | null;
  organizationMembershipRole: OrganizationMembershipRole | null;
  systemRoles: SystemRoleType[];
};

export function buildFeedbackSubmitContextExtra(
  ctx: ActorContext,
): FeedbackSubmitContextExtra | null {
  if (ctx.kind !== "authenticated") return null;
  return {
    organizationId: ctx.activeOrganizationId,
    workspaceRoleMode: ctx.workspaceRoleMode,
    organizationMembershipRole: ctx.organizationMembershipRole,
    systemRoles: ctx.systemRoles,
  };
}

function isFeedbackSubmitContextExtra(
  value: unknown,
): value is FeedbackSubmitContextExtra {
  if (value == null || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    "workspaceRoleMode" in record ||
    "organizationMembershipRole" in record ||
    "systemRoles" in record
  );
}

export function formatFeedbackUserRoleLabel(extra: unknown): string | null {
  if (!isFeedbackSubmitContextExtra(extra)) return null;

  const parts: string[] = [];
  if (extra.systemRoles.includes("SUPER_ADMIN")) {
    parts.push("Super admin");
  }
  if (extra.organizationMembershipRole) {
    parts.push(organizationMembershipRoleLabel(extra.organizationMembershipRole));
  } else if (extra.workspaceRoleMode === "admin") {
    parts.push("Manager");
  } else if (extra.workspaceRoleMode === "member") {
    parts.push("Commercial");
  }

  if (parts.length === 0) return null;
  return parts.join(" · ");
}
