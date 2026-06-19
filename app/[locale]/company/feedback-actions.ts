"use server";

import { z } from "zod";
import { put } from "@vercel/blob";
import { blobPutOptions, resolveBlobPutAuth } from "@/lib/blob-config";
import { blobUrlBelongsToOrg, buildOrgBlobPath } from "@/lib/blob-paths";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { createFeedback } from "@/src/core/application/create-feedback";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";

const feedbackSchema = z.object({
  type: z.enum(["BUG", "IDEA", "QUESTION", "OTHER"]),
  message: z.string().trim().min(5).max(5000),
  screenshotUrl: z.string().url().nullable().optional(),
  pageUrl: z.string().max(2000).nullable().optional(),
  userAgent: z.string().max(500).nullable().optional(),
  viewport: z.string().max(32).nullable().optional(),
  screenSize: z.string().max(32).nullable().optional(),
  locale: z.string().max(16).nullable().optional(),
  consoleErrors: z.array(z.string()).max(20).optional(),
});

export async function submitFeedbackAction(input: z.infer<typeof feedbackSchema>) {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );

  if (
    parsed.data.screenshotUrl &&
    (ctx.kind !== "authenticated" ||
      !ctx.activeOrganizationId ||
      !blobUrlBelongsToOrg(parsed.data.screenshotUrl, ctx.activeOrganizationId))
  ) {
    return { ok: false as const };
  }

  let companyName: string | null = null;
  if (ctx.kind === "authenticated" && ctx.activeOrganizationId) {
    const org = await deps.orgDirectory.getOrganizationById(
      ctx.activeOrganizationId,
    );
    companyName = org?.name ?? null;
  }

  await createFeedback(deps, {
    organizationId:
      ctx.kind === "authenticated" ? ctx.activeOrganizationId : null,
    userId: principal.userId,
    userEmail: ctx.kind === "authenticated" ? ctx.email : null,
    companyName,
    type: parsed.data.type,
    message: parsed.data.message,
    screenshotUrl: parsed.data.screenshotUrl ?? null,
    pageUrl: parsed.data.pageUrl ?? null,
    userAgent: parsed.data.userAgent ?? null,
    browser: parsed.data.userAgent?.split(" ").slice(-2).join(" ") ?? null,
    os: null,
    deviceType: null,
    viewport: parsed.data.viewport ?? null,
    screenSize: parsed.data.screenSize ?? null,
    locale: parsed.data.locale ?? null,
    appVersion: process.env.NEXT_PUBLIC_COMMIT_SHA ?? null,
    consoleErrors: parsed.data.consoleErrors ?? [],
    extra: {},
  });

  return { ok: true as const };
}

export async function uploadFeedbackScreenshotAction(formData: FormData) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false as const };
  }

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const };
  }
  const auth = resolveBlobPutAuth();
  if (!auth) {
    return { ok: false as const };
  }
  const pathname = buildOrgBlobPath(
    ctx.activeOrganizationId,
    "feedbacks",
    `${Date.now()}.png`,
  );
  const blob = await put(pathname, file, blobPutOptions(auth, { addRandomSuffix: true }));
  return { ok: true as const, url: blob.url };
}
