"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { requireAiGatewayApiKey } from "@/lib/env";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { generateFollowUpEmailForMeeting } from "@/src/core/application/generate-follow-up-email";
import { runMeetingAnalysis } from "@/src/core/application/run-meeting-analysis";

const meetingIdSchema = z.string().cuid();

export async function runAllMeetingAnalysesAction(meetingId: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" as const };

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" as const };
  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevatedOrganizationId: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" as const };
  }

  const orgId = ctx.activeOrganizationId;
  for (const kind of ["SONCAS", "DISC", "KISS"] as const) {
    const r = await runMeetingAnalysis(deps, {
      organizationId: orgId,
      meetingId: parsed.data,
      kind,
      model: ANALYSIS_GATEWAY_MODEL,
    });
    if (!r.ok) {
      return { ok: false as const, error: r.error, message: r.message, failedKind: kind };
    }
  }

  revalidatePath(`/company/rendez-vous/${parsed.data}`);
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  return { ok: true as const };
}

export async function generateFollowUpEmailAction(meetingId: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" as const };

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" as const };
  requireAiGatewayApiKey();

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevatedOrganizationId: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" as const };
  }

  const meeting = await deps.meetings.findMeetingDetailWithAnalyses({
    id: parsed.data,
    organizationId: ctx.activeOrganizationId,
  });
  if (!meeting) return { ok: false as const, error: "NOT_FOUND" as const };

  const settings = await deps.organizationSettings.findByOrganizationId(
    ctx.activeOrganizationId,
  );

  try {
    const email = await generateFollowUpEmailForMeeting(
      { analysis: deps.analysis },
      { meeting, organizationSettings: settings, model: ANALYSIS_GATEWAY_MODEL },
    );
    const draft = [
      `Objet : ${email.subject}`,
      "",
      email.greeting,
      "",
      email.painPoints,
      "",
      email.proposedSolutions,
      "",
      email.nextSteps,
      "",
      email.closing,
    ].join("\n");

    await deps.meetings.updateMeetingFollowUpDraft({
      id: parsed.data,
      organizationId: ctx.activeOrganizationId,
      followUpEmailDraft: draft,
    });

    revalidatePath(`/company/rendez-vous/${parsed.data}`);
    return { ok: true as const, draft };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false as const, error: "FAILED" as const, message };
  }
}

export async function saveFollowUpEmailDraftAction(meetingId: string, draft: string) {
  const parsed = meetingIdSchema.safeParse(meetingId);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" as const };

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevatedOrganizationId: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" as const };
  }

  const ok = await deps.meetings.updateMeetingFollowUpDraft({
    id: parsed.data,
    organizationId: ctx.activeOrganizationId,
    followUpEmailDraft: draft.trim() || null,
  });
  if (!ok) return { ok: false as const, error: "NOT_FOUND" as const };

  revalidatePath(`/company/rendez-vous/${parsed.data}`);
  return { ok: true as const };
}
