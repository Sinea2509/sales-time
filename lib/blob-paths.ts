const ORG_ROOT = "orgs";

/** Current (`orgs/`) plus legacy prefixes still readable for existing blobs. */
const ORG_PATH_PREFIXES = [
  (orgId: string) => `${ORG_ROOT}/${orgId}/`,
  (orgId: string) => `meetings/transcripts/${orgId}/`,
  (orgId: string) => `org-logos/${orgId}/`,
] as const;

export function buildOrgBlobPath(
  organizationId: string,
  category: "meetings/transcripts" | "meetings/audio" | "feedbacks" | "logos",
  filename: string,
): string {
  return `${ORG_ROOT}/${organizationId}/${category}/${filename}`;
}

export function buildUserBlobPath(
  userId: string,
  category: "avatars",
  filename: string,
): string {
  return `users/${userId}/${category}/${filename}`;
}

export function extractUserIdFromBlobPath(pathname: string): string | null {
  const match = /^users\/([^/]+)\//.exec(pathname);
  return match?.[1] ?? null;
}

export function blobPathBelongsToUser(
  pathname: string,
  userId: string,
): boolean {
  return pathname.startsWith(`users/${userId}/`);
}

export function blobUrlBelongsToUser(blobUrl: string, userId: string): boolean {
  const pathname = blobUrlToPathname(blobUrl);
  if (!pathname) {
    return false;
  }
  return blobPathBelongsToUser(pathname, userId);
}

export function blobProxyUrl(blobUrl: string): string {
  return `/api/org-blob?url=${encodeURIComponent(blobUrl)}`;
}

export function sanitizeBlobFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return cleaned.length > 0 ? cleaned : "file";
}

export function blobUrlToPathname(blobUrl: string): string | null {
  try {
    const pathname = new URL(blobUrl).pathname.replace(/^\/+/, "");
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

export function extractOrgIdFromBlobPath(pathname: string): string | null {
  const patterns = [
    /^orgs\/([^/]+)\//,
    /^meetings\/transcripts\/([^/]+)\//,
    /^org-logos\/([^/]+)\//,
  ] as const;

  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/** Pre-org-prefix uploads (e.g. `feedbacks/123.png`), super-admin only via proxy. */
export function isLegacyUnscopedBlobPath(pathname: string): boolean {
  return (
    pathname.startsWith("feedbacks/") &&
    extractOrgIdFromBlobPath(pathname) === null
  );
}

export function blobPathBelongsToOrg(
  pathname: string,
  organizationId: string,
): boolean {
  return ORG_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix(organizationId)),
  );
}

export function blobUrlBelongsToOrg(
  blobUrl: string,
  organizationId: string,
): boolean {
  const pathname = blobUrlToPathname(blobUrl);
  if (!pathname) {
    return false;
  }
  return blobPathBelongsToOrg(pathname, organizationId);
}
