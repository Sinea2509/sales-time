import { head } from "@vercel/blob";
import { resolveBlobPutAuth } from "@/lib/blob-config";
import {
  blobPathBelongsToOrg,
  blobPathBelongsToUser,
  blobUrlToPathname,
  isLegacyUnscopedBlobPath,
} from "@/lib/blob-paths";
import type { ActorContext } from "@/src/core/domain/actor-context";

export type OrgBlobAccessScope = "active-org" | "member-org";

export function canAccessOrgBlob(input: {
  ctx: Extract<ActorContext, { kind: "authenticated" }>;
  orgIdFromPath: string;
  scope: OrgBlobAccessScope;
  membershipOrganizationIds: string[];
}): boolean {
  if (input.ctx.systemRoles.includes("SUPER_ADMIN")) {
    return true;
  }

  if (input.scope === "active-org") {
    return input.ctx.activeOrganizationId === input.orgIdFromPath;
  }

  return input.membershipOrganizationIds.includes(input.orgIdFromPath);
}

/** Proxy access: super admins see all; users their own avatars; members their org blobs. */
export function canAccessBlobUrl(input: {
  ctx: Extract<ActorContext, { kind: "authenticated" }>;
  pathname: string;
  orgIdFromPath: string | null;
  userIdFromPath: string | null;
  membershipOrganizationIds: string[];
}): boolean {
  if (input.ctx.systemRoles.includes("SUPER_ADMIN")) {
    return true;
  }

  if (input.userIdFromPath) {
    return input.ctx.userId === input.userIdFromPath;
  }

  if (isLegacyUnscopedBlobPath(input.pathname)) {
    return false;
  }

  if (!input.orgIdFromPath) {
    return false;
  }

  return canAccessOrgBlob({
    ctx: input.ctx,
    orgIdFromPath: input.orgIdFromPath,
    scope: "member-org",
    membershipOrganizationIds: input.membershipOrganizationIds,
  });
}

async function fetchBlobBytesDirect(
  blobUrl: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const auth = resolveBlobPutAuth();
  if (auth && "token" in auth) {
    try {
      const meta = await head(blobUrl, { token: auth.token });
      const response = await fetch(meta.downloadUrl, { cache: "no-store" });
      if (response.ok) {
        return {
          bytes: Buffer.from(await response.arrayBuffer()),
          contentType: meta.contentType || "application/octet-stream",
        };
      }
    } catch {
      // Fall back to direct fetch below.
    }
  }

  try {
    const response = await fetch(blobUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      contentType:
        response.headers.get("content-type") ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function fetchOrgBlobBytes(input: {
  organizationId: string;
  blobUrl: string;
}): Promise<{ bytes: Buffer; contentType: string } | null> {
  const pathname = blobUrlToPathname(input.blobUrl);
  if (!pathname || !blobPathBelongsToOrg(pathname, input.organizationId)) {
    return null;
  }

  return fetchBlobBytesDirect(input.blobUrl);
}

export async function fetchUserBlobBytes(input: {
  userId: string;
  blobUrl: string;
}): Promise<{ bytes: Buffer; contentType: string } | null> {
  const pathname = blobUrlToPathname(input.blobUrl);
  if (!pathname || !blobPathBelongsToUser(pathname, input.userId)) {
    return null;
  }

  return fetchBlobBytesDirect(input.blobUrl);
}

export async function fetchBlobBytes(input: {
  blobUrl: string;
  organizationId: string | null;
  userId: string | null;
  allowLegacyUnscoped: boolean;
}): Promise<{ bytes: Buffer; contentType: string } | null> {
  const pathname = blobUrlToPathname(input.blobUrl);
  if (!pathname) {
    return null;
  }

  if (input.userId) {
    return fetchUserBlobBytes({ userId: input.userId, blobUrl: input.blobUrl });
  }

  if (input.organizationId) {
    return fetchOrgBlobBytes({
      organizationId: input.organizationId,
      blobUrl: input.blobUrl,
    });
  }

  if (!input.allowLegacyUnscoped || !isLegacyUnscopedBlobPath(pathname)) {
    return null;
  }

  return fetchBlobBytesDirect(input.blobUrl);
}
