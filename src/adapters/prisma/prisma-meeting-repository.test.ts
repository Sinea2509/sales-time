import { describe, expect, it } from "@jest/globals";
import { PrismaMeetingRepository } from "./prisma-meeting-repository";

/**
 * La trace de la consigne sur une analyse enregistrée.
 *
 * Les cas d'usage vérifient qu'ils la transmettent ; ce test vérifie qu'elle
 * arrive jusqu'à la base, et qu'une analyse faite sans consigne
 * d'organisation l'écrit nulle plutôt que de l'omettre.
 */
function fakeDb() {
  const create = jest.fn(async (args: { data: Record<string, unknown> }) => ({
    id: "a1",
    meetingId: args.data.meetingId,
    kind: args.data.kind,
    model: args.data.model,
    result: args.data.result,
    createdAt: new Date("2026-09-24T12:00:00.000Z"),
  }));
  return { db: { meetingAnalysis: { create } }, create };
}

describe("PrismaMeetingRepository.createAnalysis", () => {
  it("enregistre la consigne d'organisation qui a produit l'analyse", async () => {
    const { db, create } = fakeDb();
    await new PrismaMeetingRepository(db as never).createAnalysis({
      meetingId: "m1",
      kind: "SONCAS",
      promptVersionId: "pv",
      organizationPromptVersionId: "opv_1",
      model: "openai/gpt-4o-mini",
      result: {},
    });

    expect(create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        promptVersionId: "pv",
        organizationPromptVersionId: "opv_1",
      }),
    );
  });

  it("écrit nulle la consigne d'organisation quand aucune n'a servi", async () => {
    const { db, create } = fakeDb();
    await new PrismaMeetingRepository(db as never).createAnalysis({
      meetingId: "m1",
      kind: "DISC",
      promptVersionId: "pv",
      model: "openai/gpt-4o-mini",
      result: {},
    });

    expect(create.mock.calls[0][0].data.organizationPromptVersionId).toBeNull();
  });
});
