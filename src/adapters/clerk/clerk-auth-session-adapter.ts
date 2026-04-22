import { auth } from "@clerk/nextjs/server";
import type { AuthSessionPort } from "@/src/core/ports/auth-session-port";

export const clerkAuthSessionAdapter: AuthSessionPort = {
  async getClerkUserId() {
    const { userId } = await auth();
    return userId ?? null;
  },
  async getClerkOrganizationId() {
    const { orgId } = await auth();
    return orgId ?? null;
  },
  async getClerkOrganizationRole() {
    const { orgRole } = await auth();
    return orgRole ?? null;
  },
};
