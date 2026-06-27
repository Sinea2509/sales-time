import { readThroughAiSummaryCache } from "./read-through-ai-summary-cache";

describe("readThroughAiSummaryCache", () => {
  it("returns cached payload without calling compute", async () => {
    const get = jest.fn().mockResolvedValue({ forces: "cached" });
    const set = jest.fn();
    const compute = jest.fn();

    const result = await readThroughAiSummaryCache(
      { aiSummaryCache: { get, set, invalidateForOrganization: jest.fn() } },
      {
        organizationId: "org1",
        scopeKey: "SELLER_PERFORMANCE:u1:90",
        meetingsFingerprint: "fp1",
        compute,
      },
    );

    expect(result).toEqual({ forces: "cached" });
    expect(compute).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("computes and stores when cache misses", async () => {
    const get = jest.fn().mockResolvedValue(null);
    const set = jest.fn().mockResolvedValue(undefined);
    const compute = jest.fn().mockResolvedValue({ forces: "fresh" });

    const result = await readThroughAiSummaryCache(
      { aiSummaryCache: { get, set, invalidateForOrganization: jest.fn() } },
      {
        organizationId: "org1",
        scopeKey: "SELLER_PERFORMANCE:u1:90",
        meetingsFingerprint: "fp1",
        compute,
      },
    );

    expect(result).toEqual({ forces: "fresh" });
    expect(set).toHaveBeenCalledWith({
      organizationId: "org1",
      scopeKey: "SELLER_PERFORMANCE:u1:90",
      meetingsFingerprint: "fp1",
      payload: { forces: "fresh" },
    });
  });
});
