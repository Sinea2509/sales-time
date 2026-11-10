import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { MobileDeviceRepositoryPort } from "@/src/core/ports/mobile-device-repository-port";

export class PrismaMobileDeviceRepository implements MobileDeviceRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async register(input: {
    userId: string;
    expoPushToken: string;
    platform: string;
  }): Promise<void> {
    /*
      Un téléphone passé d'un compte à un autre garde son jeton : il ne doit
      plus recevoir les notifications du premier.
    */
    await this.db.mobileDevice.upsert({
      where: { expoPushToken: input.expoPushToken },
      create: {
        userId: input.userId,
        expoPushToken: input.expoPushToken,
        platform: input.platform,
      },
      update: { userId: input.userId, platform: input.platform },
    });
  }

  async listPushTokensForUser(userId: string): Promise<string[]> {
    const rows = await this.db.mobileDevice.findMany({
      where: { userId },
      select: { expoPushToken: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });
    return rows.map((r) => r.expoPushToken);
  }

  async unregister(input: {
    userId: string;
    expoPushToken: string;
  }): Promise<boolean> {
    const out = await this.db.mobileDevice.deleteMany({
      where: { userId: input.userId, expoPushToken: input.expoPushToken },
    });
    return out.count > 0;
  }

  async deleteTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.db.mobileDevice.deleteMany({
      where: { expoPushToken: { in: tokens } },
    });
  }
}
