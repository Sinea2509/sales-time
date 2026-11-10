import type { MobileDeviceRepositoryPort } from "@/src/core/ports/mobile-device-repository-port";
import type {
  NotificationRepositoryPort,
  NotificationRow,
} from "@/src/core/ports/notification-repository-port";
import type { PushSenderPort } from "@/src/core/ports/push-sender-port";

/**
 * Les notifications du site, envoyées aussi sur les téléphones de leur
 * destinataire. « Analyse terminée » arrive ainsi sur le téléphone du
 * commercial, qui ouvre son mail de suivi depuis la voiture.
 *
 * Le site ne change pas : la notification s'enregistre d'abord, puis part
 * vers les téléphones. Un échec de l'envoi ne la fait jamais échouer.
 */
export class PushingNotificationRepository implements NotificationRepositoryPort {
  constructor(
    private readonly inner: NotificationRepositoryPort,
    private readonly devices: MobileDeviceRepositoryPort,
    private readonly push: PushSenderPort,
  ) {}

  async create(input: {
    organizationId: string;
    userId: string;
    title: string;
    body: string;
    href?: string | null;
  }): Promise<NotificationRow> {
    const row = await this.inner.create(input);
    try {
      const tokens = await this.devices.listPushTokensForUser(input.userId);
      if (tokens.length > 0) {
        const { invalidTokens } = await this.push.send(
          tokens.map((to) => ({
            to,
            title: input.title,
            body: input.body,
            data: {
              notificationId: row.id,
              organizationId: input.organizationId,
              ...(input.href ? { href: input.href } : {}),
            },
          })),
        );
        await this.devices.deleteTokens(invalidTokens);
      }
    } catch {
      /* La notification du site est enregistrée : c'est elle qui compte. */
    }
    return row;
  }

  listUnreadForUser(userId: string, limit?: number) {
    return this.inner.listUnreadForUser(userId, limit);
  }

  countUnreadForUser(userId: string) {
    return this.inner.countUnreadForUser(userId);
  }

  markRead(input: { id: string; userId: string }) {
    return this.inner.markRead(input);
  }

  markAllRead(userId: string) {
    return this.inner.markAllRead(userId);
  }
}
