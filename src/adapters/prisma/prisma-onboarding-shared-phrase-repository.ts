import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  OnboardingSharedPhraseKindSlug,
  OnboardingSharedPhraseListRow,
  OnboardingSharedPhraseRepositoryPort,
} from "@/src/core/ports/onboarding-shared-phrase-repository-port";

export class PrismaOnboardingSharedPhraseRepository implements OnboardingSharedPhraseRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async listByKind(input: {
    kind: OnboardingSharedPhraseKindSlug;
    take: number;
  }): Promise<OnboardingSharedPhraseListRow[]> {
    return this.db.onboardingSharedPhrase.findMany({
      where: { kind: input.kind },
      orderBy: { createdAt: "desc" },
      take: input.take,
      select: { id: true, text: true, normalizedText: true },
    });
  }

  async createPhrase(input: {
    kind: OnboardingSharedPhraseKindSlug;
    text: string;
    normalizedText: string;
    createdByUserId: string;
  }): Promise<{ id: string; text: string }> {
    const row = await this.db.onboardingSharedPhrase.create({
      data: {
        kind: input.kind,
        text: input.text,
        normalizedText: input.normalizedText,
        createdByUserId: input.createdByUserId,
      },
      select: { id: true, text: true },
    });
    return row;
  }
}
