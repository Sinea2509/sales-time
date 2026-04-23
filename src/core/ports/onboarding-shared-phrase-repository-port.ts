export type OnboardingSharedPhraseKindSlug = "OBJECTION" | "ARGUMENT";

export type OnboardingSharedPhraseListRow = {
  id: string;
  text: string;
  normalizedText: string;
};

export interface OnboardingSharedPhraseRepositoryPort {
  listByKind(input: {
    kind: OnboardingSharedPhraseKindSlug;
    take: number;
  }): Promise<OnboardingSharedPhraseListRow[]>;

  createPhrase(input: {
    kind: OnboardingSharedPhraseKindSlug;
    text: string;
    normalizedText: string;
    createdByUserId: string;
  }): Promise<{ id: string; text: string }>;
}
