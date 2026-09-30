import type { PrismaClient } from "@/lib/generated/prisma/client";
import { memberNameLine } from "@/src/core/domain/member-name-line";
import {
  isOrganizationPromptKind,
  ORGANIZATION_PROMPT_KINDS,
  type OrganizationPromptKind,
} from "@/src/core/domain/organization-prompts";
import type {
  OrganizationPromptLatest,
  OrganizationPromptRepositoryPort,
  OrganizationPromptVersionRow,
} from "@/src/core/ports/organization-prompt-repository-port";

const withAuthor = {
  author: { select: { firstName: true, lastName: true, email: true } },
} as const;

/*
  La plus récente d'abord ; à la milliseconde près, l'identifiant départage,
  pour que deux lectures rendent toujours la même ligne.
*/
const latestFirst = [{ createdAt: "desc" }, { id: "desc" }] as const;

type RowWithAuthor = {
  id: string;
  organizationId: string;
  kind: string;
  markdown: string | null;
  authorUserId: string | null;
  createdAt: Date;
  author: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

function toRow(row: RowWithAuthor): OrganizationPromptVersionRow {
  if (!isOrganizationPromptKind(row.kind)) {
    // La table n'est alimentée que par les six types : le contraire est un bogue.
    throw new Error(
      `Consigne d'organisation d'un type inattendu : ${row.kind}`,
    );
  }
  return {
    id: row.id,
    organizationId: row.organizationId,
    kind: row.kind,
    markdown: row.markdown,
    authorUserId: row.authorUserId,
    authorName: row.author ? memberNameLine(row.author) : null,
    createdAt: row.createdAt,
  };
}

export class PrismaOrganizationPromptRepository implements OrganizationPromptRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  /*
    Lue à chaque analyse : l'organisation et le type filtrent toujours, et
    rien d'autre que l'identifiant et le texte ne sort de la base.
  */
  async findLatest(input: {
    organizationId: string;
    kind: OrganizationPromptKind;
  }): Promise<OrganizationPromptLatest | null> {
    return this.db.organizationPromptVersion.findFirst({
      where: { organizationId: input.organizationId, kind: input.kind },
      orderBy: [...latestFirst],
      select: { id: true, markdown: true },
    });
  }

  async listLatest(input: {
    organizationId: string;
  }): Promise<OrganizationPromptVersionRow[]> {
    /*
      Six lectures servies par l'index (organisation, type, date), plutôt
      qu'un `distinct` que Prisma ferait en mémoire sur tout l'historique.
    */
    const rows = await Promise.all(
      ORGANIZATION_PROMPT_KINDS.map((kind) =>
        this.db.organizationPromptVersion.findFirst({
          where: { organizationId: input.organizationId, kind },
          orderBy: [...latestFirst],
          include: withAuthor,
        }),
      ),
    );
    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .map(toRow);
  }

  async append(input: {
    organizationId: string;
    kind: OrganizationPromptKind;
    markdown: string | null;
    authorUserId: string;
  }): Promise<OrganizationPromptVersionRow> {
    const row = await this.db.organizationPromptVersion.create({
      data: {
        organizationId: input.organizationId,
        kind: input.kind,
        markdown: input.markdown,
        authorUserId: input.authorUserId,
      },
      include: withAuthor,
    });
    return toRow(row);
  }
}
