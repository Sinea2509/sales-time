import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { blobPutOptions, resolveBlobPutAuth } from "@/lib/blob-config";
import { buildOrgBlobPath } from "@/lib/blob-paths";
import { getApplicationDeps } from "@/lib/application-deps";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export async function POST(request: Request) {
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
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const auth = resolveBlobPutAuth();
  if (!auth) {
    return NextResponse.json({ error: "Blob not configured" }, { status: 503 });
  }

  const pathname = buildOrgBlobPath(
    ctx.activeOrganizationId,
    "feedbacks",
    `${Date.now()}.png`,
  );
  const blob = await put(pathname, file, blobPutOptions(auth, { addRandomSuffix: true }));

  return NextResponse.json({ url: blob.url });
}
