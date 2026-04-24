"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { requireAiGatewayApiKey } from "@/lib/env";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { runMeetingAnalysis } from "@/src/core/application/run-meeting-analysis";

const meetingIdSchema = z.string().trim().min(1).max(64);

export async function runSoncasAnalysisAction(meetingId: string) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrg,
    },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const result = await runMeetingAnalysis(deps, {
    organizationId: ctx.activeOrganizationId,
    meetingId: parsedId.data,
    kind: "SONCAS",
    model: ANALYSIS_GATEWAY_MODEL,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidatePath("/company/analyse");
  revalidatePath(`/company/rendez-vous/${parsedId.data}`);
  revalidatePath("/company");
  return { ok: true as const, analysisId: result.analysisId };
}

export async function runDiscAnalysisAction(meetingId: string) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrg,
    },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const result = await runMeetingAnalysis(deps, {
    organizationId: ctx.activeOrganizationId,
    meetingId: parsedId.data,
    kind: "DISC",
    model: ANALYSIS_GATEWAY_MODEL,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidatePath("/company/analyse");
  revalidatePath(`/company/rendez-vous/${parsedId.data}`);
  revalidatePath("/company");
  return { ok: true as const, analysisId: result.analysisId };
}

export async function runKissAnalysisAction(meetingId: string) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    {
      superAdminElevatedOrganizationId: superAdminOrg,
    },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const result = await runMeetingAnalysis(deps, {
    organizationId: ctx.activeOrganizationId,
    meetingId: parsedId.data,
    kind: "KISS",
    model: ANALYSIS_GATEWAY_MODEL,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidatePath("/company/analyse");
  revalidatePath(`/company/rendez-vous/${parsedId.data}`);
  revalidatePath("/company");
  return { ok: true as const, analysisId: result.analysisId };
}
