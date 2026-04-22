export interface AuthSessionPort {
  getClerkUserId(): Promise<string | null>;
  /** Active Clerk organization from session (OrganizationSwitcher / setActive). */
  getClerkOrganizationId(): Promise<string | null>;
  /** Clerk organization role for the active org, e.g. org:admin */
  getClerkOrganizationRole(): Promise<string | null>;
}
