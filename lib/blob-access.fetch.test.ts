import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fetchBlobBytes, fetchOrgBlobBytes } from "@/lib/blob-access";

describe("fetchOrgBlobBytes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects blob URLs outside the organization prefix", async () => {
    const fetchMock = jest.spyOn(global, "fetch");
    const result = await fetchOrgBlobBytes({
      organizationId: "org_1",
      blobUrl: "https://blob.example/orgs/org_2/feedbacks/a.png",
    });
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads bytes when the blob path matches the organization", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("hello"),
      headers: { get: () => "text/plain" },
    } as unknown as Response);

    const result = await fetchOrgBlobBytes({
      organizationId: "org_1",
      blobUrl: "https://blob.example/orgs/org_1/feedbacks/a.png",
    });

    expect(result?.bytes.toString("utf8")).toBe("hello");
  });
});

describe("fetchBlobBytes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads legacy unscoped blobs when allowed", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from("legacy"),
      headers: { get: () => "image/png" },
    } as unknown as Response);

    const result = await fetchBlobBytes({
      blobUrl: "https://blob.example/feedbacks/legacy.png",
      organizationId: null,
      userId: null,
      allowLegacyUnscoped: true,
    });

    expect(result?.bytes.toString("utf8")).toBe("legacy");
  });

  it("rejects legacy unscoped blobs for non-super-admin callers", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    const result = await fetchBlobBytes({
      blobUrl: "https://blob.example/feedbacks/legacy.png",
      organizationId: null,
      userId: null,
      allowLegacyUnscoped: false,
    });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
