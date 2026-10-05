import { describe, expect, it, jest } from "@jest/globals";
import { reuseAnalysisOutput } from "./reuse-analysis-output";

type Key = {
  organizationId: string;
  scopeKey: string;
  meetingsFingerprint: string;
};

function memoryCache() {
  const rows = new Map<string, unknown>();
  const id = (k: Key) =>
    `${k.organizationId}|${k.scopeKey}|${k.meetingsFingerprint}`;
  return {
    get: jest.fn(async (k: Key) => rows.get(id(k)) ?? null),
    set: jest.fn(async (k: Key & { payload: unknown }) => {
      rows.set(id(k), k.payload);
    }),
    invalidateForOrganization: jest.fn(async () => undefined),
  };
}

const APPEL = {
  organizationId: "org",
  kind: "SCORECARD",
  model: "openai/gpt-4o-mini",
  systemPrompt: "consigne",
  userPrompt: "transcript",
};

describe("reuseAnalysisOutput", () => {
  it("rend à l'identique un appel déjà fait, sans rappeler le modèle", async () => {
    const aiSummaryCache = memoryCache();
    let n = 0;
    const compute = jest.fn(async () => ({ score: ++n }));
    const first = await reuseAnalysisOutput(
      { aiSummaryCache },
      { ...APPEL, compute },
    );
    const second = await reuseAnalysisOutput(
      { aiSummaryCache },
      { ...APPEL, compute },
    );
    expect(first).toEqual({ value: { score: 1 }, reused: false });
    expect(second).toEqual({ value: { score: 1 }, reused: true });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it("refait l'appel dès que la consigne, le transcript ou le modèle change", async () => {
    const aiSummaryCache = memoryCache();
    const compute = jest.fn(async () => ({ ok: true }));
    await reuseAnalysisOutput({ aiSummaryCache }, { ...APPEL, compute });
    await reuseAnalysisOutput(
      { aiSummaryCache },
      { ...APPEL, systemPrompt: "consigne 2", compute },
    );
    await reuseAnalysisOutput(
      { aiSummaryCache },
      { ...APPEL, userPrompt: "autre", compute },
    );
    await reuseAnalysisOutput(
      { aiSummaryCache },
      { ...APPEL, model: "anthropic/claude-sonnet-4.6", compute },
    );
    expect(compute).toHaveBeenCalledTimes(4);
  });

  it("appelle simplement le modèle sans cache, ou quand le cache est en panne", async () => {
    const compute = jest.fn(async () => 1);
    expect(await reuseAnalysisOutput({}, { ...APPEL, compute })).toEqual({
      value: 1,
      reused: false,
    });
    const broken = {
      get: jest.fn(async () => {
        throw new Error("db");
      }),
      set: jest.fn(async () => {
        throw new Error("db");
      }),
      invalidateForOrganization: jest.fn(async () => undefined),
    };
    expect(
      await reuseAnalysisOutput(
        { aiSummaryCache: broken },
        { ...APPEL, compute },
      ),
    ).toEqual({ value: 1, reused: false });
  });
});
