"use server";

import { z } from "zod";
import { put } from "@vercel/blob";
import { blobPutOptions, resolveBlobPutAuth } from "@/lib/blob-config";
import { blobUrlBelongsToOrg, buildOrgBlobPath } from "@/lib/blob-paths";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { createFeedback } from "@/src/core/application/create-feedback";
import { buildFeedbackSubmitContextExtra } from "@/src/core/domain/feedback-submit-context";
import {
  feedbackTargetElementSchema,
  type FeedbackExtraPayload,
} from "@/src/core/domain/feedback-target-element";
import {
  feedbackPrioritySchema,
  parseFeedbackUserAgent,
  resolveFeedbackPriority,
} from "@/src/core/domain/feedback-technical-context";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";

const feedbackSchema = z.object({
  type: z.enum(["BUG", "IDEA", "QUESTION", "OTHER"]),
  message: z.string().trim().min(5).max(5000),
  priority: feedbackPrioritySchema.optional(),
  screenshotUrl: z.string().url().nullable().optional(),
  elementCropUrl: z.string().url().nullable().optional(),
  targetElement: feedbackTargetElementSchema.nullable().optional(),
  pageUrl: z.string().max(2000).nullable().optional(),
  userAgent: z.string().max(500).nullable().optional(),
  viewport: z.string().max(32).nullable().optional(),
  screenSize: z.string().max(32).nullable().optional(),
  locale: z.string().max(16).nullable().optional(),
  consoleErrors: z.array(z.string()).max(20).optional(),
  consoleWarnings: z.array(z.string()).max(20).optional(),
  networkErrors: z.array(z.string()).max(20).optional(),
  scrollPosition: z.string().max(32).nullable().optional(),
  routePath: z.string().max(500).nullable().optional(),
});

function assertOrgBlobUrl(
  url: string | null | undefined,
  organizationId: string | null,
): boolean {
  if (!url) return true;
  if (!organizationId) return false;
  return blobUrlBelongsToOrg(url, organizationId);
}

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

  const organizationId =
    ctx.kind === "authenticated" ? ctx.activeOrganizationId : null;

  if (
    !assertOrgBlobUrl(parsed.data.screenshotUrl, organizationId) ||
    !assertOrgBlobUrl(parsed.data.elementCropUrl, organizationId)
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

  const ua = parseFeedbackUserAgent(parsed.data.userAgent);
  const submitContext = buildFeedbackSubmitContextExtra(ctx);
  const extra: FeedbackExtraPayload = {
    submitContext,
    targetElement: parsed.data.targetElement ?? null,
    elementCropUrl: parsed.data.elementCropUrl ?? null,
    networkErrors: parsed.data.networkErrors ?? [],
    consoleWarnings: parsed.data.consoleWarnings ?? [],
    technicalContext: {
      routePath: parsed.data.routePath ?? null,
      referrer: null,
      timezone: null,
      scrollPosition: parsed.data.scrollPosition ?? null,
    },
  };

  await createFeedback(deps, {
    organizationId,
    userId: principal.userId,
    userEmail: ctx.kind === "authenticated" ? ctx.email : null,
    companyName,
    type: parsed.data.type,
    message: parsed.data.message,
    priority: resolveFeedbackPriority({
      type: parsed.data.type,
      priority: parsed.data.priority,
    }),
    screenshotUrl: parsed.data.screenshotUrl ?? null,
    pageUrl: parsed.data.pageUrl ?? null,
    userAgent: parsed.data.userAgent ?? null,
    browser: ua.browser,
    os: ua.os,
    deviceType: ua.deviceType,
    viewport: parsed.data.viewport ?? null,
    screenSize: parsed.data.screenSize ?? null,
    locale: parsed.data.locale ?? null,
    appVersion: process.env.NEXT_PUBLIC_COMMIT_SHA ?? null,
    consoleErrors: parsed.data.consoleErrors ?? [],
    extra,
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
