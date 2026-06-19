import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  FeedbackRepositoryPort,
  FeedbackRow,
} from "@/src/core/ports/feedback-repository-port";

export class PrismaFeedbackRepository implements FeedbackRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async create(
    input: Omit<FeedbackRow, "id" | "status" | "adminNotes" | "handledAt" | "createdAt">,
  ): Promise<FeedbackRow> {
    const row = await this.db.feedback.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        userEmail: input.userEmail,
        companyName: input.companyName,
        type: input.type,
        message: input.message,
        screenshotUrl: input.screenshotUrl,
        pageUrl: input.pageUrl,
        userAgent: input.userAgent,
        browser: input.browser,
        os: input.os,
        deviceType: input.deviceType,
        viewport: input.viewport,
        screenSize: input.screenSize,
        locale: input.locale,
        appVersion: input.appVersion,
        consoleErrors: input.consoleErrors as object | undefined,
        extra: input.extra as object | undefined,
      },
    });
    return row as FeedbackRow;
  }

  async list(input: {
    status?: FeedbackRow["status"] | null;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: FeedbackRow[]; total: number }> {
    const where = input.status ? { status: input.status } : {};
    const [rows, total] = await Promise.all([
      this.db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit ?? 50,
        skip: input.offset ?? 0,
      }),
      this.db.feedback.count({ where }),
    ]);
    return { rows: rows as FeedbackRow[], total };
  }

  async countGroupedByStatus(): Promise<
    Record<FeedbackRow["status"], number> & { all: number }
  > {
    const [all, groups] = await Promise.all([
      this.db.feedback.count(),
      this.db.feedback.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const counts = {
      all,
      NEW: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      WONT_FIX: 0,
    };

    for (const group of groups) {
      counts[group.status] = group._count._all;
    }

    return counts;
  }

  async findById(id: string): Promise<FeedbackRow | null> {
    const row = await this.db.feedback.findUnique({ where: { id } });
    return row as FeedbackRow | null;
  }

  async updateStatus(input: {
    id: string;
    status: FeedbackRow["status"];
    adminNotes?: string | null;
  }): Promise<boolean> {
    try {
      await this.db.feedback.update({
        where: { id: input.id },
        data: {
          status: input.status,
          adminNotes: input.adminNotes,
          handledAt: input.status === "NEW" ? null : new Date(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async countOpen(): Promise<number> {
    return this.db.feedback.count({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
    });
  }

  async purgeOlderThan(before: Date): Promise<number> {
    const result = await this.db.feedback.deleteMany({
      where: { createdAt: { lt: before } },
    });
    return result.count;
  }
}
