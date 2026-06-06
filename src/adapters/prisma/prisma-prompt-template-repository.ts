import type { PrismaClient } from "@/lib/generated/prisma/client";
import { AnalysisKind } from "@/lib/generated/prisma/client";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
  PromptTemplateVersionRow,
} from "@/src/core/ports/prompt-template-repository-port";

function toPrismaAnalysisKind(kind: AnalysisKindSlug): AnalysisKind {
  return kind as AnalysisKind;
}

export class PrismaPromptTemplateRepository implements PromptTemplateRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async getCurrentVersion(input: {
    kind: AnalysisKindSlug;
  }): Promise<PromptTemplateVersionRow | null> {
    const template = await this.db.promptTemplate.findUnique({
      where: { kind: toPrismaAnalysisKind(input.kind) },
      include: { currentVersion: true },
    });
    const v = template?.currentVersion;
    if (!v || !template) return null;
    return {
      id: v.id,
      templateId: v.templateId,
      kind: input.kind,
      version: v.version,
      markdown: v.markdown,
      authorUserId: v.authorUserId,
      createdAt: v.createdAt,
    };
  }

  async listVersions(input: {
    kind: AnalysisKindSlug;
    limit?: number;
  }): Promise<PromptTemplateVersionRow[]> {
    const template = await this.db.promptTemplate.findUnique({
      where: { kind: toPrismaAnalysisKind(input.kind) },
    });
    if (!template) return [];

    const rows = await this.db.promptTemplateVersion.findMany({
      where: { templateId: template.id },
      orderBy: { version: "desc" },
      take: input.limit ?? 50,
    });

    return rows.map((v) => ({
      id: v.id,
      templateId: v.templateId,
      kind: input.kind,
      version: v.version,
      markdown: v.markdown,
      authorUserId: v.authorUserId,
      createdAt: v.createdAt,
    }));
  }

  async publishNewVersion(input: {
    kind: AnalysisKindSlug;
    markdown: string;
    authorUserId: string;
  }): Promise<PromptTemplateVersionRow> {
    return this.db.$transaction(async (tx) => {
      const template = await tx.promptTemplate.upsert({
        where: { kind: toPrismaAnalysisKind(input.kind) },
        create: { kind: toPrismaAnalysisKind(input.kind) },
        update: {},
      });

      const agg = await tx.promptTemplateVersion.aggregate({
        where: { templateId: template.id },
        _max: { version: true },
      });
      const nextVersion = (agg._max.version ?? 0) + 1;

      const version = await tx.promptTemplateVersion.create({
        data: {
          templateId: template.id,
          version: nextVersion,
          markdown: input.markdown,
          authorUserId: input.authorUserId,
        },
      });

      await tx.promptTemplate.update({
        where: { id: template.id },
        data: { currentVersionId: version.id },
      });

      return {
        id: version.id,
        templateId: version.templateId,
        kind: input.kind,
        version: version.version,
        markdown: version.markdown,
        authorUserId: version.authorUserId,
        createdAt: version.createdAt,
      };
    });
  }
}
