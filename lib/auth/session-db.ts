import type { OrganizationMembershipRole } from "@/lib/generated/prisma/enums";
import type { SystemRoleType } from "@/src/core/domain/system-role-type";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokens";
import { SESSION_MAX_AGE_SEC } from "@/lib/auth/constants";

function mapSystemRoles(roles: { role: string }[]): SystemRoleType[] {
  const out: SystemRoleType[] = [];
  for (const r of roles) {
    if (r.role === "SUPER_ADMIN") out.push("SUPER_ADMIN");
  }
  return out;
}

export type MembershipDto = {
  organizationId: string;
  role: OrganizationMembershipRole;
};

export type SessionPrincipal = {
  sessionId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  registerProfileCompletedAt: Date | null;
  systemRoles: SystemRoleType[];
  memberships: MembershipDto[];
};

export async function createSessionRecord(input: {
  userId: string;
  rawToken: string;
  userAgent?: string | null;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);
  await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: hashToken(input.rawToken),
      expiresAt,
      userAgent: input.userAgent?.slice(0, 512) ?? null,
    },
  });
}

export async function deleteSessionByRawToken(rawToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { tokenHash: hashToken(rawToken) },
  });
}

export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function findSessionPrincipal(
  rawToken: string,
): Promise<SessionPrincipal | null> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const row = await prisma.session.findFirst({
    where: { tokenHash, expiresAt: { gt: now } },
    include: {
      user: {
        include: {
          systemRoles: true,
          organizationMemberships: {
            select: { organizationId: true, role: true },
          },
        },
      },
    },
  });
  if (!row) return null;
  await prisma.session.update({
    where: { id: row.id },
    data: { lastSeenAt: now },
  });
  const u = row.user;
  return {
    sessionId: row.id,
    userId: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    registerProfileCompletedAt: u.registerProfileCompletedAt,
    systemRoles: mapSystemRoles(u.systemRoles),
    memberships: u.organizationMemberships.map((m) => ({
      organizationId: m.organizationId,
      role: m.role,
    })),
  };
}
