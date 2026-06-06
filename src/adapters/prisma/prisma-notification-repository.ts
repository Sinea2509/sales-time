import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  NotificationRepositoryPort,
  NotificationRow,
} from "@/src/core/ports/notification-repository-port";

export class PrismaNotificationRepository implements NotificationRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async create(input: {
    organizationId: string;
    userId: string;
    title: string;
    body: string;
    href?: string | null;
  }): Promise<NotificationRow> {
    const row = await this.db.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
      },
    });
    return row;
  }

  async listUnreadForUser(userId: string, limit = 20): Promise<NotificationRow[]> {
    return this.db.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return this.db.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(input: { id: string; userId: string }): Promise<boolean> {
    const result = await this.db.notification.updateMany({
      where: { id: input.id, userId: input.userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }
}
