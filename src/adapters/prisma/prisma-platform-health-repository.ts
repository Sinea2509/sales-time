import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  AdminHealthCounts,
  PlatformHealthRepositoryPort,
} from "@/src/core/ports/platform-health-repository-port";

export class PrismaPlatformHealthRepository implements PlatformHealthRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async pingSelectOne(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }

  async measureSelectOneLatency(): Promise<{ ok: boolean; ms: number }> {
    const start = performance.now();
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { ok: true, ms: Math.round(performance.now() - start) };
    } catch {
      return { ok: false, ms: Math.round(performance.now() - start) };
    }
  }

  async getAdminHealthCounts(now: Date): Promise<AdminHealthCounts> {
    const [
      userCount,
      orgCount,
      meetingCount,
      analysisCount,
      sessionCount,
      activeSessions,
      expiredSessions,
      pendingOrgInvitations,
      pendingSuperAdminInvitations,
    ] = await Promise.all([
      this.db.user.count(),
      this.db.organization.count(),
      this.db.meeting.count(),
      this.db.meetingAnalysis.count(),
      this.db.session.count(),
      this.db.session.count({ where: { expiresAt: { gt: now } } }),
      this.db.session.count({ where: { expiresAt: { lte: now } } }),
      this.db.organizationInvitation.count({
        where: { status: "PENDING", expiresAt: { gt: now } },
      }),
      this.db.superAdminInvitation.count({
        where: { status: "PENDING", expiresAt: { gt: now } },
      }),
    ]);

    return {
      userCount,
      orgCount,
      meetingCount,
      analysisCount,
      sessionCount,
      activeSessions,
      expiredSessions,
      pendingOrgInvitations,
      pendingSuperAdminInvitations,
    };
  }
}
