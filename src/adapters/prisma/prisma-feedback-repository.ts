import type { PrismaClient } from "@/lib/generated/prisma/client";
import { feedbackRowHasTargetElement } from "@/src/core/domain/feedback-target-element";
import type {
  FeedbackListFilters,
  FeedbackRepositoryPort,
  FeedbackRow,
} from "@/src/core/ports/feedback-repository-port";

const PRIORITY_ORDER: FeedbackRow["priority"][] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

function buildListWhere(input: FeedbackListFilters) {
  const where: {
    status?: FeedbackRow["status"];
    type?: FeedbackRow["type"];
    priority?: FeedbackRow["priority"];
    screenshotUrl?: { not: null } | null;
  } = {};

  if (input.status) {
    where.status = input.status;
  }
  if (input.type) {
    where.type = input.type;
  }
  if (input.priority) {
    where.priority = input.priority;
  }
  if (input.hasScreenshot === true) {
    where.screenshotUrl = { not: null };
  } else if (input.hasScreenshot === false) {
    where.screenshotUrl = null;
  }

  return where;
}

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
        priority: input.priority,
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

  async list(input: FeedbackListFilters): Promise<{ rows: FeedbackRow[]; total: number }> {
    const where = buildListWhere(input);
    const take = input.limit ?? 50;
    const skip = input.offset ?? 0;

    let rows = await this.db.feedback.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: input.hasTargetElement != null ? take * 4 : take,
      skip: input.hasTargetElement != null ? 0 : skip,
    });

    if (input.hasTargetElement != null) {
      rows = rows.filter((row) =>
        input.hasTargetElement
          ? feedbackRowHasTargetElement(row.extra)
          : !feedbackRowHasTargetElement(row.extra),
      );
      const total = rows.length;
      rows = rows.slice(skip, skip + take);
      const sorted = sortFeedbackRows(rows);
      return { rows: sorted as FeedbackRow[], total };
    }

    const total = await this.db.feedback.count({ where });
    const sorted = sortFeedbackRows(rows);
    return { rows: sorted as FeedbackRow[], total };
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

function sortFeedbackRows<T extends { priority: FeedbackRow["priority"]; createdAt: Date }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const priorityDiff =
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
