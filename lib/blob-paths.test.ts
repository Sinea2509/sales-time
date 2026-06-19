import { describe, expect, it } from "@jest/globals";
import {
  blobPathBelongsToOrg,
  blobUrlBelongsToOrg,
  blobUrlToPathname,
  buildOrgBlobPath,
  extractOrgIdFromBlobPath,
  isLegacyUnscopedBlobPath,
  orgBlobProxyUrl,
  sanitizeBlobFilename,
} from "@/lib/blob-paths";

describe("blob-paths", () => {
  it("builds org-scoped paths", () => {
    expect(buildOrgBlobPath("org_1", "feedbacks", "shot.png")).toBe(
      "orgs/org_1/feedbacks/shot.png",
    );
  });

  it("extracts org id from current and legacy prefixes", () => {
    expect(extractOrgIdFromBlobPath("orgs/org_1/feedbacks/a.png")).toBe("org_1");
    expect(extractOrgIdFromBlobPath("meetings/transcripts/org_2/x.txt")).toBe(
      "org_2",
    );
    expect(extractOrgIdFromBlobPath("org-logos/org_3/logo.png")).toBe("org_3");
    expect(extractOrgIdFromBlobPath("feedbacks/a.png")).toBeNull();
  });

  it("validates org ownership for blob URLs", () => {
    const url =
      "https://store.public.blob.vercel-storage.com/orgs/org_1/feedbacks/a.png";
    expect(blobUrlToPathname(url)).toBe("orgs/org_1/feedbacks/a.png");
    expect(blobUrlBelongsToOrg(url, "org_1")).toBe(true);
    expect(blobUrlBelongsToOrg(url, "org_2")).toBe(false);
    expect(blobPathBelongsToOrg("feedbacks/a.png", "org_1")).toBe(false);
  });

  it("sanitizes unsafe filenames", () => {
    expect(sanitizeBlobFilename("../../secret.txt")).toBe("secret.txt");
    expect(sanitizeBlobFilename("my notes (1).txt")).toBe("my_notes__1_.txt");
  });

  it("builds authenticated proxy URLs", () => {
    expect(orgBlobProxyUrl("https://example.com/a.png")).toBe(
      "/api/org-blob?url=https%3A%2F%2Fexample.com%2Fa.png",
    );
  });

  it("detects legacy unscoped feedback paths", () => {
    expect(isLegacyUnscopedBlobPath("feedbacks/123.png")).toBe(true);
    expect(isLegacyUnscopedBlobPath("orgs/org_1/feedbacks/a.png")).toBe(false);
  });
});
