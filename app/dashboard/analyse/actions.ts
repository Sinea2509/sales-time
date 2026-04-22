"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { requireAiGatewayApiKey } from "@/lib/env";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { runMeetingAnalysis } from "@/src/core/application/run-meeting-analysis";

export async function runSoncasAnalysisAction(meetingId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "UNAUTHENTICATED" };

  await ensureClerkUserSynced(userId);
  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrg,
  });
  if (ctx.kind !== "authenticated" || !ctx.activeTenantClerkOrgId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const deps = makeApplicationDeps();
  const result = await runMeetingAnalysis(deps, {
    clerkOrgId: ctx.activeTenantClerkOrgId,
    meetingId,
    kind: "SONCAS",
    model: ANALYSIS_GATEWAY_MODEL,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidatePath("/dashboard/analyse");
  revalidatePath(`/dashboard/rendez-vous/${meetingId}`);
  revalidatePath("/dashboard");
  return { ok: true as const, analysisId: result.analysisId };
}

export async function runDiscAnalysisAction(meetingId: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "UNAUTHENTICATED" };

  await ensureClerkUserSynced(userId);
  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrg,
  });
  if (ctx.kind !== "authenticated" || !ctx.activeTenantClerkOrgId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const deps = makeApplicationDeps();
  const result = await runMeetingAnalysis(deps, {
    clerkOrgId: ctx.activeTenantClerkOrgId,
    meetingId,
    kind: "DISC",
    model: ANALYSIS_GATEWAY_MODEL,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, message: result.message };
  }

  revalidatePath("/dashboard/analyse");
  revalidatePath(`/dashboard/rendez-vous/${meetingId}`);
  revalidatePath("/dashboard");
  return { ok: true as const, analysisId: result.analysisId };
}
