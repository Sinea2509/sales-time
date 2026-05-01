import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  OrgTeamInvitationRow,
  OrgTeamMemberRow,
  OrganizationTeamRepositoryPort,
} from "@/src/core/ports/organization-team-repository-port";

function mapRole(r: string): "ADMIN" | "MEMBER" {
  return r === "ADMIN" ? "ADMIN" : "MEMBER";
}

export class PrismaOrganizationTeamRepository implements OrganizationTeamRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async listMembersAndPendingInvitations(organizationId: string): Promise<{
    members: OrgTeamMemberRow[];
    invitations: OrgTeamInvitationRow[];
  }> {
    const [memberships, invitations] = await Promise.all([
      this.db.organizationMembership.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.db.organizationInvitation.findMany({
        where: {
          organizationId,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const members: OrgTeamMemberRow[] = memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: mapRole(m.role),
      joinedAt: m.createdAt.toISOString(),
    }));

    const invRows: OrgTeamInvitationRow[] = invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: mapRole(i.role),
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));

    return { members: members, invitations: invRows };
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const u = await this.db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return u?.id ?? null;
  }

  async findMembership(
    userId: string,
    organizationId: string,
  ): Promise<{ id: string } | null> {
    const m = await this.db.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      select: { id: true },
    });
    return m;
  }

  async findPendingInvitationForEmail(
    organizationId: string,
    email: string,
  ): Promise<{ id: string } | null> {
    return this.db.organizationInvitation.findFirst({
      where: {
        organizationId,
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  async getOrganizationName(organizationId: string): Promise<string | null> {
    const o = await this.db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    return o?.name ?? null;
  }

  async createPendingInvitation(input: {
    organizationId: string;
    email: string;
    role: "ADMIN" | "MEMBER";
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<void> {
    await this.db.organizationInvitation.create({
      data: {
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        invitedByUserId: input.invitedByUserId,
      },
    });
  }

  async countAdminsInOrganization(organizationId: string): Promise<number> {
    return this.db.organizationMembership.count({
      where: { organizationId, role: "ADMIN" },
    });
  }

  async findMembershipWithUserEmail(
    membershipId: string,
    organizationId: string,
  ): Promise<{
    id: string;
    role: "ADMIN" | "MEMBER";
    userId: string;
    userEmail: string;
  } | null> {
    const membership = await this.db.organizationMembership.findFirst({
      where: { id: membershipId, organizationId },
      include: { user: { select: { email: true } } },
    });
    if (!membership) return null;
    return {
      id: membership.id,
      role: mapRole(membership.role),
      userId: membership.userId,
      userEmail: membership.user.email,
    };
  }

  async updateMembershipRole(
    membershipId: string,
    role: "ADMIN" | "MEMBER",
  ): Promise<void> {
    await this.db.organizationMembership.update({
      where: { id: membershipId },
      data: { role },
    });
  }

  async findMembershipByIdForOrg(
    membershipId: string,
    organizationId: string,
  ): Promise<{
    id: string;
    userId: string;
    role: "ADMIN" | "MEMBER";
  } | null> {
    const membership = await this.db.organizationMembership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) return null;
    return {
      id: membership.id,
      userId: membership.userId,
      role: mapRole(membership.role),
    };
  }

  async deleteMembership(membershipId: string): Promise<void> {
    await this.db.organizationMembership.delete({
      where: { id: membershipId },
    });
  }

  async findPendingInvitationByIdForOrg(
    invitationId: string,
    organizationId: string,
  ): Promise<{ id: string } | null> {
    return this.db.organizationInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId,
        status: "PENDING",
      },
      select: { id: true },
    });
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    await this.db.organizationInvitation.update({
      where: { id: invitationId },
      data: { status: "REVOKED" },
    });
  }

  async findMembershipForManagerView(
    organizationId: string,
    userId: string,
  ): Promise<{
    role: "ADMIN" | "MEMBER";
    user: { email: string; firstName: string | null; lastName: string | null };
  } | null> {
    const member = await this.db.organizationMembership.findFirst({
      where: { organizationId, userId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    if (!member) return null;
    return {
      role: mapRole(member.role),
      user: member.user,
    };
  }
}
