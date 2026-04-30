import type { OrganizationMembershipRole } from "../domain/organization-membership-role";

export type AdminDashboardRecentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  status: "ACTIVE" | "DISABLED";
};

export type AdminDashboardRecentOrg = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  memberCount: number;
  meetingCount: number;
};

export type AdminDailyActivePoint = { date: string; count: number };
export type AdminOrgGrowthPoint = { month: string; count: number };

export type AdminDashboardBundle = {
  totalUsers: number;
  totalOrgs: number;
  totalMeetings: number;
  totalAnalyses: number;
  dau: number;
  wau: number;
  mau: number;
  prevWau: number;
  prevMau: number;
  meetings30d: number;
  prevMeetings30d: number;
  analyses30d: number;
  activeOrgs30d: number;
  newUsersThisMonth: number;
  newOrgsThisMonth: number;
  recentUsers: AdminDashboardRecentUser[];
  recentOrgs: AdminDashboardRecentOrg[];
  dailyActiveData: AdminDailyActivePoint[];
  orgGrowthData: AdminOrgGrowthPoint[];
};

export type AdminOrgTableRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  meetingCount: number;
  invitationCount: number;
};

export type AdminOrgDetailMembership = {
  id: string;
  userId: string;
  role: OrganizationMembershipRole;
  createdAt: Date;
  user: { email: string; firstName: string | null; lastName: string | null };
};

export type AdminOrgDetailMeeting = {
  id: string;
  prospectName: string;
  meetingAt: Date;
  outcome: string;
  sellerUserId: string;
  seller: { email: string; firstName: string | null; lastName: string | null };
};

export type AdminOrganizationDetail = {
  id: string;
  name: string;
  slug: string;
  websiteNormalized: string | null;
  createdAt: Date;
  memberships: AdminOrgDetailMembership[];
  meetings: AdminOrgDetailMeeting[];
  counts: {
    memberships: number;
    meetings: number;
    invitations: number;
  };
};

export type AdminOrgAuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  reason: string | null;
  actor: { email: string };
};

export type AdminUserTableRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileRole: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  isSuperAdmin: boolean;
  memberships: Array<{
    orgId: string;
    orgName: string;
    role: OrganizationMembershipRole;
  }>;
};

export type AdminOrgOption = { id: string; name: string; slug: string };

export type AdminUserDetailMembership = {
  id: string;
  role: OrganizationMembershipRole;
  createdAt: Date;
  organization: { id: string; name: string; slug: string };
};

export type AdminUserDetailSession = {
  id: string;
  lastSeenAt: Date;
  userAgent: string | null;
  createdAt: Date;
};

export type AdminUserDetailMeeting = {
  id: string;
  prospectName: string;
  meetingAt: Date;
  outcome: string;
  organization: { id: string; name: string };
};

export type AdminUserDetail = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileRole: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  isSuperAdmin: boolean;
  organizationMemberships: AdminUserDetailMembership[];
  sessions: AdminUserDetailSession[];
  meetingsAsSeller: AdminUserDetailMeeting[];
  meetingCount: number;
  analysesCount: number;
  sessionCount: number;
};

export type AdminGlobalAuditLogRow = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorName: string | null;
  organizationId: string;
  action: string;
  reason: string | null;
  createdAt: string;
};

export type SuperAdminRoleRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  grantedAt: string;
};

export type SuperAdminPendingInviteRow = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

export interface BackofficeRepositoryPort {
  getAdminDashboardBundle(input: {
    rangeDays: number;
    now: Date;
  }): Promise<AdminDashboardBundle>;

  listOrganizationsForAdminTable(): Promise<AdminOrgTableRow[]>;

  getOrganizationDetailForAdmin(
    organizationId: string,
  ): Promise<AdminOrganizationDetail | null>;

  countMeetingAnalysesForOrganization(organizationId: string): Promise<number>;

  listAuditLogsForOrganization(
    organizationId: string,
    take: number,
  ): Promise<AdminOrgAuditLogRow[]>;

  listUsersAndOrgOptionsForAdmin(): Promise<{
    users: AdminUserTableRow[];
    orgOptions: AdminOrgOption[];
  }>;

  getUserDetailForAdmin(userId: string): Promise<AdminUserDetail | null>;

  listGlobalAuditLogs(take: number): Promise<AdminGlobalAuditLogRow[]>;

  listSuperAdminRolesWithUsers(): Promise<SuperAdminRoleRow[]>;

  listPendingSuperAdminInvitations(): Promise<SuperAdminPendingInviteRow[]>;

  findOrganizationBySlug(slug: string): Promise<{ id: string } | null>;

  createOrganization(input: { name: string; slug: string }): Promise<void>;

  findOrganizationById(
    id: string,
  ): Promise<{ id: string; name: string; slug: string } | null>;

  findOrganizationSlugConflict(
    slug: string,
    excludeOrganizationId: string,
  ): Promise<boolean>;

  updateOrganization(
    id: string,
    input: { name: string; slug: string },
  ): Promise<void>;

  findOrganizationsByIds(
    ids: string[],
  ): Promise<Array<{ id: string; name: string; slug: string }>>;

  deleteOrganizationsByIds(ids: string[]): Promise<void>;

  deleteOrganizationById(id: string): Promise<void>;

  createSuperAdminAuditLog(input: {
    actorUserId: string;
    organizationId: string;
    action: string;
    reason?: string | null;
  }): Promise<void>;

  createSuperAdminAuditLogsMany(
    entries: Array<{
      actorUserId: string;
      organizationId: string;
      action: string;
      reason?: string | null;
    }>,
  ): Promise<void>;

  findUsersByIdsForBulk(ids: string[]): Promise<Array<{ id: string; email: string }>>;

  updateUsersStatusMany(
    userIds: string[],
    status: "ACTIVE" | "DISABLED",
  ): Promise<void>;

  findUserStatusById(
    userId: string,
  ): Promise<{ id: string; status: "ACTIVE" | "DISABLED"; email: string } | null>;

  updateUserStatus(
    userId: string,
    status: "ACTIVE" | "DISABLED",
  ): Promise<void>;

  findUserByIdExists(userId: string): Promise<{ id: string } | null>;

  findUserEmailConflict(email: string, excludeUserId: string): Promise<boolean>;

  updateUserProfile(input: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): Promise<void>;

  findUserForDelete(
    userId: string,
  ): Promise<{ id: string; email: string } | null>;

  deleteUserById(userId: string): Promise<void>;

  findOrganizationNameById(
    organizationId: string,
  ): Promise<{ name: string } | null>;

  findPendingOrganizationInvitation(
    email: string,
    organizationId: string,
  ): Promise<{ id: string } | null>;

  createOrganizationInvitationAdmin(input: {
    email: string;
    organizationId: string;
    role: OrganizationMembershipRole;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<void>;

  findUserWithSuperAdminByEmail(email: string): Promise<{ id: string } | null>;

  findPendingSuperAdminInvitationByEmail(
    email: string,
  ): Promise<{ id: string } | null>;

  createSuperAdminInvitation(input: {
    email: string;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<void>;

  findPendingSuperAdminInvitationById(
    id: string,
  ): Promise<{ id: string } | null>;

  revokeSuperAdminInvitation(id: string): Promise<void>;

  findSuperAdminSystemRoleForUser(
    userId: string,
  ): Promise<{ roleRecordId: string; userEmail: string } | null>;

  deleteSystemRole(roleRecordId: string): Promise<void>;
}
