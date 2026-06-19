type BlobAccess = "public";

export type BlobPutAuth =
  | { token: string }
  | { storeId: string; oidcToken: string };

export type BlobPutOptions = {
  access: BlobAccess;
  addRandomSuffix?: boolean;
  token: string;
};

export function isBlobConfigured(): boolean {
  return resolveBlobPutAuth() !== null;
}

export function resolveBlobPutAuth(): BlobPutAuth | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    return { token };
  }

  const storeId = process.env.BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (storeId && oidcToken) {
    return { storeId, oidcToken };
  }

  return null;
}

export function blobPutOptions(
  auth: BlobPutAuth,
  options?: { addRandomSuffix?: boolean },
): BlobPutOptions {
  if (!("token" in auth)) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for server-side blob uploads");
  }

  return {
    access: "public",
    addRandomSuffix: options?.addRandomSuffix ?? false,
    token: auth.token,
  };
}

export type BlobUploadResult =
  | { ok: true; url: string }
  | { ok: false; message: string };
