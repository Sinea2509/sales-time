import { afterEach, describe, expect, it } from "@jest/globals";
import {
  isBlobConfigured,
  resolveBlobPutAuth,
} from "@/lib/blob-config";

describe("blob-config", () => {
  const originalToken = process.env.BLOB_READ_WRITE_TOKEN;
  const originalStoreId = process.env.BLOB_STORE_ID;
  const originalOidc = process.env.VERCEL_OIDC_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.BLOB_READ_WRITE_TOKEN;
    } else {
      process.env.BLOB_READ_WRITE_TOKEN = originalToken;
    }
    if (originalStoreId === undefined) {
      delete process.env.BLOB_STORE_ID;
    } else {
      process.env.BLOB_STORE_ID = originalStoreId;
    }
    if (originalOidc === undefined) {
      delete process.env.VERCEL_OIDC_TOKEN;
    } else {
      process.env.VERCEL_OIDC_TOKEN = originalOidc;
    }
  });

  it("prefers BLOB_READ_WRITE_TOKEN when set", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    process.env.BLOB_STORE_ID = "store_abc";
    process.env.VERCEL_OIDC_TOKEN = "oidc";
    expect(resolveBlobPutAuth()).toEqual({ token: "vercel_blob_rw_test" });
    expect(isBlobConfigured()).toBe(true);
  });

  it("falls back to OIDC + store id", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.BLOB_STORE_ID = "store_abc";
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    expect(resolveBlobPutAuth()).toEqual({
      storeId: "store_abc",
      oidcToken: "oidc-token",
    });
  });

  it("returns null when blob is not configured", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    expect(resolveBlobPutAuth()).toBeNull();
    expect(isBlobConfigured()).toBe(false);
  });
});
