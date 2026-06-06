export type NotificationRow = {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export interface NotificationRepositoryPort {
  create(input: {
    organizationId: string;
    userId: string;
    title: string;
    body: string;
    href?: string | null;
  }): Promise<NotificationRow>;

  listUnreadForUser(userId: string, limit?: number): Promise<NotificationRow[]>;

  countUnreadForUser(userId: string): Promise<number>;

  markRead(input: { id: string; userId: string }): Promise<boolean>;

  markAllRead(userId: string): Promise<number>;
}
