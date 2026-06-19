import { NextResponse } from "next/server";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import {
  canAccessBlobUrl,
  fetchBlobBytes,
} from "@/lib/blob-access";
import {
  blobUrlToPathname,
  extractOrgIdFromBlobPath,
  extractUserIdFromBlobPath,
} from "@/lib/blob-paths";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

const querySchema = z.object({
  url: z.string().url(),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({
    url: new URL(request.url).searchParams.get("url"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const pathname = blobUrlToPathname(parsed.data.url);
  if (!pathname) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgIdFromPath = extractOrgIdFromBlobPath(pathname);
  const userIdFromPath = extractUserIdFromBlobPath(pathname);

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (ctx.kind !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuperAdmin = ctx.systemRoles.includes("SUPER_ADMIN");

  if (
    !canAccessBlobUrl({
      ctx,
      pathname,
      orgIdFromPath,
      userIdFromPath,
      membershipOrganizationIds: principal.memberships.map(
        (membership) => membership.organizationId,
      ),
    })
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = await fetchBlobBytes({
    blobUrl: parsed.data.url,
    organizationId: orgIdFromPath,
    userId: userIdFromPath,
    allowLegacyUnscoped: isSuperAdmin,
  });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
