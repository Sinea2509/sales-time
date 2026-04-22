import type { SystemRoleType } from "./system-role-type";

/** Clerk organization role slug (defaults: org:admin | org:member). */
export type ClerkOrgRoleSlug = string | null;

export type ActorContext =
  | { kind: "guest" }
  | {
      kind: "authenticated";
      clerkUserId: string;
      internalUserId: string | null;
      /** Active org on the Clerk session JWT. */
      sessionClerkOrgId: string | null;
      sessionClerkOrgRole: ClerkOrgRoleSlug;
      /** Resolved tenant for app logic (super-admin cookie wins when set). */
      activeTenantClerkOrgId: string | null;
      systemRoles: SystemRoleType[];
      superAdminActiveClerkOrgId: string | null;
      canManageOrganization: boolean;
      isElevatedSuperAdmin: boolean;
    };
