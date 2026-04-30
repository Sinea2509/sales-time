import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  SignInReadPort,
  SignInUserLookup,
} from "@/src/core/ports/sign-in-read-port";

export class PrismaSignInReadRepository implements SignInReadPort {
  constructor(private readonly db: PrismaClient) {}

  async findUserForPasswordSignIn(email: string): Promise<SignInUserLookup | null> {
    const user = await this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        status: true,
        systemRoles: { select: { role: true } },
        organizationMemberships: { select: { organizationId: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      passwordHash: user.passwordHash,
      status: user.status,
      isSuperAdmin: user.systemRoles.some((r) => r.role === "SUPER_ADMIN"),
      organizationMembershipCount: user.organizationMemberships.length,
    };
  }
}
