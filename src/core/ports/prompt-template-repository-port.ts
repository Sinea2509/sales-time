export type AnalysisKindSlug =
  | "SONCAS"
  | "DISC"
  | "KISS"
  | "SCORECARD"
  | "OBJECTIONS"
  | "FOLLOW_UP_EMAIL"
  | "MEETING_BRIEFING"
  | "MEETING_DETAIL_SYNTHESIS"
  | "SELLER_PERFORMANCE"
  | "SELLER_AFFINITY"
  | "ORG_KISS_ROLLUP"
  | "TEAM_COACHING";

export const ANALYSIS_KIND_SLUGS = [
  "SONCAS",
  "DISC",
  "KISS",
  "SCORECARD",
  "OBJECTIONS",
  "FOLLOW_UP_EMAIL",
  "MEETING_BRIEFING",
  "MEETING_DETAIL_SYNTHESIS",
  "SELLER_PERFORMANCE",
  "SELLER_AFFINITY",
  "ORG_KISS_ROLLUP",
  "TEAM_COACHING",
] as const satisfies readonly AnalysisKindSlug[];

export type PromptTemplateVersionRow = {
  id: string;
  templateId: string;
  kind: AnalysisKindSlug;
  version: number;
  markdown: string;
  authorUserId: string;
  createdAt: Date;
};

export interface PromptTemplateRepositoryPort {
  getCurrentVersion(input: {
    kind: AnalysisKindSlug;
  }): Promise<PromptTemplateVersionRow | null>;

  /** Vercel AI Gateway model id (`provider/model`) configured for this prompt kind. */
  getModelForKind(input: { kind: AnalysisKindSlug }): Promise<string>;

  updateModelForKind(input: {
    kind: AnalysisKindSlug;
    model: string;
  }): Promise<string>;

  /** Ensures a DB prompt version exists (seeds from default markdown when missing). */
  ensureCurrentVersion(input: {
    kind: AnalysisKindSlug;
    defaultMarkdown: string;
  }): Promise<PromptTemplateVersionRow>;

  listVersions(input: {
    kind: AnalysisKindSlug;
    limit?: number;
  }): Promise<PromptTemplateVersionRow[]>;

  publishNewVersion(input: {
    kind: AnalysisKindSlug;
    markdown: string;
    authorUserId: string;
  }): Promise<PromptTemplateVersionRow>;
}
