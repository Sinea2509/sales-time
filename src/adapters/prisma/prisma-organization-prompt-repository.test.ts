import { describe, expect, it } from "@jest/globals";
import { ORGANIZATION_PROMPT_KINDS } from "@/src/core/domain/organization-prompts";
import { PrismaOrganizationPromptRepository } from "./prisma-organization-prompt-repository";

/**
 * Ce que l'adaptateur demande à la base.
 *
 * Les tests des cas d'usage passent par un dépôt en mémoire, qui filtre et
 * ordonne lui-même : un adaptateur qui oublierait l'organisation dans sa
 * requête, ou qui lirait la plus ancienne ligne au lieu de la plus récente,
 * les laisserait tous verts. Ceux-ci regardent la requête elle-même.
 */

const LATEST_FIRST = [{ createdAt: "desc" }, { id: "desc" }];

function fakeDb(rows: { findFirst?: unknown[]; create?: unknown }) {
  const queue = [...(rows.findFirst ?? [])];
  const findFirst = jest
    .fn<Promise<unknown>, [unknown]>()
    .mockImplementation(async () => queue.shift() ?? null);
  const create = jest
    .fn<Promise<unknown>, [unknown]>()
    .mockImplementation(async () => rows.create);
  return {
    db: { organizationPromptVersion: { findFirst, create } },
    findFirst,
    create,
  };
}

function repository(db: unknown) {
  return new PrismaOrganizationPromptRepository(db as never);
}

describe("PrismaOrganizationPromptRepository.findLatest", () => {
  it("filtre par organisation et par type, et lit la ligne la plus récente", async () => {
    const { db, findFirst } = fakeDb({
      findFirst: [{ id: "opv_2", markdown: "SONCAS de A" }],
    });

    const latest = await repository(db).findLatest({
      organizationId: "org_a",
      kind: "SONCAS",
    });

    expect(latest).toEqual({ id: "opv_2", markdown: "SONCAS de A" });
    expect(findFirst).toHaveBeenCalledWith({
      where: { organizationId: "org_a", kind: "SONCAS" },
      orderBy: LATEST_FIRST,
      select: { id: true, markdown: true },
    });
  });
});

describe("PrismaOrganizationPromptRepository.listLatest", () => {
  it("lit la dernière ligne de chacun des six types, avec son auteur", async () => {
    const createdAt = new Date("2026-09-24T12:00:00.000Z");
    const { db, findFirst } = fakeDb({
      findFirst: [
        null,
        {
          id: "opv_1",
          organizationId: "org_a",
          kind: "SONCAS",
          markdown: "SONCAS de A",
          authorUserId: "u1",
          createdAt,
          author: { firstName: "Claire", lastName: "Morel", email: "c@a.fr" },
        },
        {
          id: "opv_3",
          organizationId: "org_a",
          kind: "DISC",
          markdown: null,
          authorUserId: null,
          createdAt,
          author: null,
        },
      ],
    });

    const rows = await repository(db).listLatest({ organizationId: "org_a" });

    expect(findFirst).toHaveBeenCalledTimes(ORGANIZATION_PROMPT_KINDS.length);
    ORGANIZATION_PROMPT_KINDS.forEach((kind, index) => {
      expect(findFirst.mock.calls[index]).toEqual([
        expect.objectContaining({
          where: { organizationId: "org_a", kind },
          orderBy: LATEST_FIRST,
        }),
      ]);
    });
    expect(rows).toEqual([
      {
        id: "opv_1",
        organizationId: "org_a",
        kind: "SONCAS",
        markdown: "SONCAS de A",
        authorUserId: "u1",
        authorName: "Claire Morel",
        createdAt,
      },
      {
        id: "opv_3",
        organizationId: "org_a",
        kind: "DISC",
        markdown: null,
        authorUserId: null,
        authorName: null,
        createdAt,
      },
    ]);
  });
});

describe("PrismaOrganizationPromptRepository.append", () => {
  it("ajoute une ligne pour l'organisation et l'auteur donnés", async () => {
    const createdAt = new Date("2026-09-24T12:00:00.000Z");
    const { db, create } = fakeDb({
      create: {
        id: "opv_9",
        organizationId: "org_a",
        kind: "KISS",
        markdown: null,
        authorUserId: "u1",
        createdAt,
        author: { firstName: null, lastName: null, email: "manager@a.fr" },
      },
    });

    const row = await repository(db).append({
      organizationId: "org_a",
      kind: "KISS",
      markdown: null,
      authorUserId: "u1",
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          organizationId: "org_a",
          kind: "KISS",
          markdown: null,
          authorUserId: "u1",
        },
      }),
    );
    expect(row.authorName).toBe("manager@a.fr");
  });

  it("refuse une ligne d'un type qu'une organisation ne règle pas", async () => {
    const { db } = fakeDb({
      create: {
        id: "opv_9",
        organizationId: "org_a",
        kind: "MEETING_BRIEFING",
        markdown: "x",
        authorUserId: "u1",
        createdAt: new Date(),
        author: null,
      },
    });

    await expect(
      repository(db).append({
        organizationId: "org_a",
        kind: "MEETING_BRIEFING" as never,
        markdown: "x",
        authorUserId: "u1",
      }),
    ).rejects.toThrow("type inattendu");
  });
});
