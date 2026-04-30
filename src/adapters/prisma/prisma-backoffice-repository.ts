import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  AdminDashboardBundle,
  AdminGlobalAuditLogRow,
  AdminOrgAuditLogRow,
  AdminOrgDetailMeeting,
  AdminOrgDetailMembership,
  AdminOrganizationDetail,
  AdminOrgOption,
  AdminOrgTableRow,
  AdminUserDetail,
  AdminUserTableRow,
  BackofficeRepositoryPort,
  SuperAdminPendingInviteRow,
  SuperAdminRoleRow,
} from "@/src/core/ports/backoffice-repository-port";
import type { OrganizationMembershipRole } from "@/src/core/domain/organization-membership-role";

function mapMembershipRole(r: string): OrganizationMembershipRole {
  return r === "ADMIN" ? "ADMIN" : "MEMBER";
}

export class PrismaBackofficeRepository implements BackofficeRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async getAdminDashboardBundle(input: {
    rangeDays: number;
    now: Date;
  }): Promise<AdminDashboardBundle> {
    const { rangeDays, now } = input;
    const halfRange = Math.floor(rangeDays / 2);

    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const prevMonthStart = new Date(
      now.getTime() - rangeDays * 2 * 24 * 60 * 60 * 1000,
    );
    const prevWeekStart = new Date(
      now.getTime() - halfRange * 2 * 24 * 60 * 60 * 1000,
    );

    const [
      totalUsers,
      totalOrgs,
      totalMeetings,
      totalAnalyses,
      dau,
      wau,
      mau,
      prevWau,
      prevMau,
      meetings30d,
      prevMeetings30d,
      analyses30d,
      activeOrgs30d,
      newUsersThisMonth,
      newOrgsThisMonth,
      recentUsers,
      recentOrgs,
      dailyActiveData,
      orgGrowthData,
    ] = await Promise.all([
      this.db.user.count(),
      this.db.organization.count(),
      this.db.meeting.count(),
      this.db.meetingAnalysis.count(),
      this.db.session
        .groupBy({ by: ["userId"], where: { lastSeenAt: { gte: dayAgo } } })
        .then((r) => r.length),
      this.db.session
        .groupBy({ by: ["userId"], where: { lastSeenAt: { gte: weekAgo } } })
        .then((r) => r.length),
      this.db.session
        .groupBy({ by: ["userId"], where: { lastSeenAt: { gte: monthAgo } } })
        .then((r) => r.length),
      this.db.session
        .groupBy({
          by: ["userId"],
          where: { lastSeenAt: { gte: prevWeekStart, lt: weekAgo } },
        })
        .then((r) => r.length),
      this.db.session
        .groupBy({
          by: ["userId"],
          where: { lastSeenAt: { gte: prevMonthStart, lt: monthAgo } },
        })
        .then((r) => r.length),
      this.db.meeting.count({ where: { createdAt: { gte: monthAgo } } }),
      this.db.meeting.count({
        where: { createdAt: { gte: prevMonthStart, lt: monthAgo } },
      }),
      this.db.meetingAnalysis.count({ where: { createdAt: { gte: monthAgo } } }),
      this.db.meeting
        .groupBy({
          by: ["organizationId"],
          where: { createdAt: { gte: monthAgo } },
        })
        .then((r) => r.length),
      this.db.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.db.organization.count({ where: { createdAt: { gte: monthAgo } } }),
      this.db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          status: true,
        },
      }),
      this.db.organization.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          _count: { select: { memberships: true, meetings: true } },
        },
      }),
      Promise.all(
        Array.from({ length: 14 }, (_, i) => {
          const dayStart = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          return this.db.session
            .groupBy({
              by: ["userId"],
              where: { lastSeenAt: { gte: dayStart, lt: dayEnd } },
            })
            .then((r) => ({
              date: dayStart.toISOString().slice(5, 10),
              count: r.length,
            }));
        }),
      ),
      Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now);
          d.setMonth(d.getMonth() - (5 - i));
          d.setDate(1);
          d.setHours(0, 0, 0, 0);
          const next = new Date(d);
          next.setMonth(next.getMonth() + 1);
          return this.db.organization
            .count({ where: { createdAt: { gte: d, lt: next } } })
            .then((count) => ({
              month: d.toLocaleDateString("fr-FR", { month: "short" }),
              count,
            }));
        }),
      ),
    ]);

    return {
      totalUsers,
      totalOrgs,
      totalMeetings,
      totalAnalyses,
      dau,
      wau,
      mau,
      prevWau,
      prevMau,
      meetings30d,
      prevMeetings30d,
      analyses30d,
      activeOrgs30d,
      newUsersThisMonth,
      newOrgsThisMonth,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        createdAt: u.createdAt,
        status: u.status as "ACTIVE" | "DISABLED",
      })),
      recentOrgs: recentOrgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        createdAt: o.createdAt,
        memberCount: o._count.memberships,
        meetingCount: o._count.meetings,
      })),
      dailyActiveData,
      orgGrowthData,
    };
  }

  async listOrganizationsForAdminTable(): Promise<AdminOrgTableRow[]> {
    const organizations = await this.db.organization.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        websiteNormalized: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memberships: true,
            meetings: true,
            invitations: true,
          },
        },
      },
    });

    return organizations.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      website: o.websiteNormalized,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      memberCount: o._count.memberships,
      meetingCount: o._count.meetings,
      invitationCount: o._count.invitations,
    }));
  }

  async getOrganizationDetailForAdmin(
    organizationId: string,
  ): Promise<AdminOrganizationDetail | null> {
    const org = await this.db.organization.findUnique({
      where: { id: organizationId },
      include: {
        memberships: {
          include: {
            user: { select: { email: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        meetings: {
          take: 10,
          orderBy: { meetingAt: "desc" },
          select: {
            id: true,
            prospectName: true,
            meetingAt: true,
            outcome: true,
            sellerUserId: true,
            seller: { select: { email: true, firstName: true, lastName: true } },
          },
        },
        _count: {
          select: {
            memberships: true,
            meetings: true,
            invitations: true,
          },
        },
      },
    });

    if (!org) return null;

    const memberships: AdminOrgDetailMembership[] = org.memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: mapMembershipRole(m.role),
      createdAt: m.createdAt,
      user: m.user,
    }));

    const meetings: AdminOrgDetailMeeting[] = org.meetings.map((m) => ({
      id: m.id,
      prospectName: m.prospectName,
      meetingAt: m.meetingAt,
      outcome: m.outcome,
      sellerUserId: m.sellerUserId,
      seller: m.seller,
    }));

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      websiteNormalized: org.websiteNormalized,
      createdAt: org.createdAt,
      memberships,
      meetings,
      counts: {
        memberships: org._count.memberships,
        meetings: org._count.meetings,
        invitations: org._count.invitations,
      },
    };
  }

  async countMeetingAnalysesForOrganization(
    organizationId: string,
  ): Promise<number> {
    return this.db.meetingAnalysis.count({
      where: { meeting: { organizationId } },
    });
  }

  async listAuditLogsForOrganization(
    organizationId: string,
    take: number,
  ): Promise<AdminOrgAuditLogRow[]> {
    const auditLogs = await this.db.superAdminAuditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        actor: { select: { email: true } },
      },
    });

    return auditLogs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      action: log.action,
      reason: log.reason,
      actor: { email: log.actor.email },
    }));
  }

  async listUsersAndOrgOptionsForAdmin(): Promise<{
    users: AdminUserTableRow[];
    orgOptions: AdminOrgOption[];
  }> {
    const [users, organizations] = await Promise.all([
      this.db.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          profileRole: true,
          status: true,
          createdAt: true,
          systemRoles: { select: { role: true } },
          organizationMemberships: {
            select: {
              role: true,
              organization: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.db.organization.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    const serialized: AdminUserTableRow[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      profileRole: u.profileRole,
      status: u.status as "ACTIVE" | "DISABLED",
      createdAt: u.createdAt.toISOString(),
      isSuperAdmin: u.systemRoles.some((r) => r.role === "SUPER_ADMIN"),
      memberships: u.organizationMemberships.map((m) => ({
        orgId: m.organization.id,
        orgName: m.organization.name,
        role: mapMembershipRole(m.role),
      })),
    }));

    return {
      users: serialized,
      orgOptions: organizations.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
      })),
    };
  }

  async getUserDetailForAdmin(userId: string): Promise<AdminUserDetail | null> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        systemRoles: { select: { role: true } },
        organizationMemberships: {
          include: {
            organization: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        sessions: {
          where: { expiresAt: { gt: new Date() } },
          orderBy: { lastSeenAt: "desc" },
          take: 20,
        },
        meetingsAsSeller: {
          take: 10,
          orderBy: { meetingAt: "desc" },
          select: {
            id: true,
            prospectName: true,
            meetingAt: true,
            outcome: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) return null;

    const [meetingCount, analysesCount, sessionCount] = await Promise.all([
      this.db.meeting.count({ where: { sellerUserId: userId } }),
      this.db.meetingAnalysis.count({
        where: { meeting: { sellerUserId: userId } },
      }),
      this.db.session.count({ where: { userId } }),
    ]);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileRole: user.profileRole,
      status: user.status as "ACTIVE" | "DISABLED",
      createdAt: user.createdAt,
      isSuperAdmin: user.systemRoles.some((r) => r.role === "SUPER_ADMIN"),
      organizationMemberships: user.organizationMemberships.map((m) => ({
        id: m.id,
        role: mapMembershipRole(m.role),
        createdAt: m.createdAt,
        organization: m.organization,
      })),
      sessions: user.sessions.map((s) => ({
        id: s.id,
        lastSeenAt: s.lastSeenAt,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
      })),
      meetingsAsSeller: user.meetingsAsSeller.map((m) => ({
        id: m.id,
        prospectName: m.prospectName,
        meetingAt: m.meetingAt,
        outcome: m.outcome,
        organization: m.organization,
      })),
      meetingCount,
      analysesCount,
      sessionCount,
    };
  }

  async listGlobalAuditLogs(take: number): Promise<AdminGlobalAuditLogRow[]> {
    const logs = await this.db.superAdminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        actorUserId: true,
        actor: {
          select: { email: true, firstName: true, lastName: true },
        },
        organizationId: true,
        action: true,
        reason: true,
        createdAt: true,
      },
    });

    return logs.map((log) => ({
      id: log.id,
      actorUserId: log.actorUserId,
      actorEmail: log.actor.email,
      actorName:
        log.actor.firstName && log.actor.lastName
          ? `${log.actor.firstName} ${log.actor.lastName}`
          : null,
      organizationId: log.organizationId,
      action: log.action,
      reason: log.reason,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async listSuperAdminRolesWithUsers(): Promise<SuperAdminRoleRow[]> {
    const superAdminRoles = await this.db.systemRole.findMany({
      where: { role: "SUPER_ADMIN" },
      orderBy: { createdAt: "asc" },
      select: {
        userId: true,
        createdAt: true,
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    return superAdminRoles.map((r) => ({
      userId: r.userId,
      email: r.user.email,
      firstName: r.user.firstName,
      lastName: r.user.lastName,
      grantedAt: r.createdAt.toISOString(),
    }));
  }

  async listPendingSuperAdminInvitations(): Promise<SuperAdminPendingInviteRow[]> {
    const rows = await this.db.superAdminInvitation.findMany({
      where: {
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, createdAt: true, expiresAt: true },
    });

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
    }));
  }

  async findOrganizationBySlug(slug: string): Promise<{ id: string } | null> {
    return this.db.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  async createOrganization(input: { name: string; slug: string }): Promise<void> {
    await this.db.organization.create({
      data: { name: input.name, slug: input.slug },
    });
  }

  async findOrganizationById(
    id: string,
  ): Promise<{ id: string; name: string; slug: string } | null> {
    return this.db.organization.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });
  }

  async findOrganizationSlugConflict(
    slug: string,
    excludeOrganizationId: string,
  ): Promise<boolean> {
    const row = await this.db.organization.findFirst({
      where: { slug, NOT: { id: excludeOrganizationId } },
      select: { id: true },
    });
    return row !== null;
  }

  async updateOrganization(
    id: string,
    input: { name: string; slug: string },
  ): Promise<void> {
    await this.db.organization.update({
      where: { id },
      data: { name: input.name, slug: input.slug },
    });
  }

  async findOrganizationsByIds(
    ids: string[],
  ): Promise<Array<{ id: string; name: string; slug: string }>> {
    return this.db.organization.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true },
    });
  }

  async deleteOrganizationsByIds(ids: string[]): Promise<void> {
    await this.db.organization.deleteMany({ where: { id: { in: ids } } });
  }

  async deleteOrganizationById(id: string): Promise<void> {
    await this.db.organization.delete({ where: { id } });
  }

  async createSuperAdminAuditLog(input: {
    actorUserId: string;
    organizationId: string;
    action: string;
    reason?: string | null;
  }): Promise<void> {
    await this.db.superAdminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        organizationId: input.organizationId,
        action: input.action,
        reason: input.reason ?? null,
      },
    });
  }

  async createSuperAdminAuditLogsMany(
    entries: Array<{
      actorUserId: string;
      organizationId: string;
      action: string;
      reason?: string | null;
    }>,
  ): Promise<void> {
    if (entries.length === 0) return;
    await this.db.superAdminAuditLog.createMany({
      data: entries.map((e) => ({
        actorUserId: e.actorUserId,
        organizationId: e.organizationId,
        action: e.action,
        reason: e.reason ?? null,
      })),
    });
  }

  async findUsersByIdsForBulk(
    ids: string[],
  ): Promise<Array<{ id: string; email: string }>> {
    return this.db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true },
    });
  }

  async updateUsersStatusMany(
    userIds: string[],
    status: "ACTIVE" | "DISABLED",
  ): Promise<void> {
    await this.db.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    });
  }

  async findUserStatusById(
    userId: string,
  ): Promise<{ id: string; status: "ACTIVE" | "DISABLED"; email: string } | null> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, email: true },
    });
    if (!user) return null;
    return {
      id: user.id,
      status: user.status as "ACTIVE" | "DISABLED",
      email: user.email,
    };
  }

  async updateUserStatus(
    userId: string,
    status: "ACTIVE" | "DISABLED",
  ): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async findUserByIdExists(userId: string): Promise<{ id: string } | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }

  async findUserEmailConflict(
    email: string,
    excludeUserId: string,
  ): Promise<boolean> {
    const row = await this.db.user.findFirst({
      where: { email, NOT: { id: excludeUserId } },
      select: { id: true },
    });
    return row !== null;
  }

  async updateUserProfile(input: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): Promise<void> {
    await this.db.user.update({
      where: { id: input.userId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      },
    });
  }

  async findUserForDelete(
    userId: string,
  ): Promise<{ id: string; email: string } | null> {
    return this.db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
  }

  async deleteUserById(userId: string): Promise<void> {
    await this.db.user.delete({ where: { id: userId } });
  }

  async findOrganizationNameById(
    organizationId: string,
  ): Promise<{ name: string } | null> {
    return this.db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
  }

  async findPendingOrganizationInvitation(
    email: string,
    organizationId: string,
  ): Promise<{ id: string } | null> {
    return this.db.organizationInvitation.findFirst({
      where: {
        email,
        organizationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  async createOrganizationInvitationAdmin(input: {
    email: string;
    organizationId: string;
    role: OrganizationMembershipRole;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<void> {
    await this.db.organizationInvitation.create({
      data: {
        email: input.email,
        organizationId: input.organizationId,
        role: input.role,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedByUserId: input.invitedByUserId,
      },
    });
  }

  async findUserWithSuperAdminByEmail(
    email: string,
  ): Promise<{ id: string } | null> {
    return this.db.user.findFirst({
      where: {
        email,
        systemRoles: { some: { role: "SUPER_ADMIN" } },
      },
      select: { id: true },
    });
  }

  async findPendingSuperAdminInvitationByEmail(
    email: string,
  ): Promise<{ id: string } | null> {
    return this.db.superAdminInvitation.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  async createSuperAdminInvitation(input: {
    email: string;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<void> {
    await this.db.superAdminInvitation.create({
      data: {
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedByUserId: input.invitedByUserId,
      },
    });
  }

  async findPendingSuperAdminInvitationById(
    id: string,
  ): Promise<{ id: string } | null> {
    return this.db.superAdminInvitation.findFirst({
      where: { id, status: "PENDING" },
      select: { id: true },
    });
  }

  async revokeSuperAdminInvitation(id: string): Promise<void> {
    await this.db.superAdminInvitation.update({
      where: { id },
      data: { status: "REVOKED" },
    });
  }

  async findSuperAdminSystemRoleForUser(
    userId: string,
  ): Promise<{ roleRecordId: string; userEmail: string } | null> {
    const role = await this.db.systemRole.findFirst({
      where: { userId, role: "SUPER_ADMIN" },
      include: { user: { select: { email: true } } },
    });
    if (!role) return null;
    return { roleRecordId: role.id, userEmail: role.user.email };
  }

  async deleteSystemRole(roleRecordId: string): Promise<void> {
    await this.db.systemRole.delete({ where: { id: roleRecordId } });
  }
}
