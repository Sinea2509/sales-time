export type AnalysisKindSlug = "SONCAS" | "DISC";

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
