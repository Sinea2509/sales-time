import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  DomainUser,
  UserRepositoryPort,
} from "@/src/core/ports/user-repository-port";
import type { SystemRoleType } from "@/src/core/domain/system-role-type";

function mapRole(role: string): SystemRoleType {
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  throw new Error(`Unknown system role: ${role}`);
}

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findByClerkUserId(clerkUserId: string): Promise<DomainUser | null> {
    const row = await this.db.user.findUnique({
      where: { clerkUserId },
      include: { systemRoles: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      clerkUserId: row.clerkUserId,
      systemRoles: row.systemRoles.map((r) => mapRole(r.role)),
    };
  }
}
