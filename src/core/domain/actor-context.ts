import type { WorkspaceRoleMode } from "./authorization-policy";
import type { SystemRoleType } from "./system-role-type";

export type OrganizationMembershipRoleSlug = "ADMIN" | "MEMBER" | null;

export type ActorContext =
  | { kind: "guest" }
  | {
      kind: "authenticated";
      userId: string;
      internalUserId: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      /** Org id from membership cookie (may be invalid if tampered). */
      sessionOrganizationId: string | null;
      /** Role in `sessionOrganizationId` when it matches a membership. */
      organizationMembershipRole: OrganizationMembershipRoleSlug;
      /** Resolved tenant (elevation cookie wins for super admins). */
      activeOrganizationId: string | null;
      systemRoles: SystemRoleType[];
      superAdminElevatedOrganizationId: string | null;
      canManageOrganization: boolean;
      isElevatedSuperAdmin: boolean;
      workspaceRoleMode: WorkspaceRoleMode | null;
    };
