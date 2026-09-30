import type { OrganizationPromptKind } from "@/src/core/domain/organization-prompts";
import type {
  OrganizationPromptRepositoryPort,
  OrganizationPromptVersionRow,
} from "@/src/core/ports/organization-prompt-repository-port";

/**
 * Les consignes d'organisation en mémoire, pour les tests.
 *
 * La même règle que l'adaptateur Prisma : des lignes qu'on ajoute sans jamais
 * les modifier, et la dernière de l'organisation pour le type qui fait foi.
 * Chaque ligne ajoutée est datée une minute après la précédente, pour que
 * l'ordre ne dépende pas de l'horloge de la machine.
 */
export function inMemoryOrganizationPrompts(
  initial: ReadonlyArray<{
    organizationId: string;
    kind: OrganizationPromptKind;
    markdown: string | null;
    authorUserId?: string;
    authorName?: string | null;
  }> = [],
): OrganizationPromptRepositoryPort & {
  readonly rows: OrganizationPromptVersionRow[];
} {
  const rows: OrganizationPromptVersionRow[] = [];
  const start = Date.parse("2026-09-24T08:00:00.000Z");

  function push(input: {
    organizationId: string;
    kind: OrganizationPromptKind;
    markdown: string | null;
    authorUserId?: string;
    authorName?: string | null;
  }): OrganizationPromptVersionRow {
    const row: OrganizationPromptVersionRow = {
      id: `opv_${rows.length + 1}`,
      organizationId: input.organizationId,
      kind: input.kind,
      markdown: input.markdown,
      authorUserId: input.authorUserId ?? "user_manager",
      authorName:
        input.authorName === undefined ? "Claire Morel" : input.authorName,
      createdAt: new Date(start + rows.length * 60_000),
    };
    rows.push(row);
    return row;
  }

  for (const row of initial) push(row);

  async function findLatest(input: {
    organizationId: string;
    kind: OrganizationPromptKind;
  }): Promise<OrganizationPromptVersionRow | null> {
    const own = rows.filter(
      (row) =>
        row.organizationId === input.organizationId && row.kind === input.kind,
    );
    return own[own.length - 1] ?? null;
  }

  return {
    rows,
    findLatest,
    async listLatest(input) {
      const kinds = [...new Set(rows.map((row) => row.kind))];
      const latest = await Promise.all(
        kinds.map((kind) =>
          findLatest({ organizationId: input.organizationId, kind }),
        ),
      );
      return latest.filter((row): row is OrganizationPromptVersionRow =>
        Boolean(row),
      );
    },
    async append(input) {
      return push(input);
    },
  };
}

/** Aucune consigne d'organisation : la consigne d'origine sert partout. */
export function noOrganizationPrompts(): OrganizationPromptRepositoryPort {
  return inMemoryOrganizationPrompts();
}
