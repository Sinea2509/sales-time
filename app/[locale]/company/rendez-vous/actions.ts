"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { createMeetingForOrg } from "@/src/core/application/create-meeting";

const meetingOutcomeSchema = z.enum([
  "WON",
  "LOST",
  "FOLLOW_UP",
  "NO_SHOW",
  "OTHER",
]);

const createMeetingSchema = z.object({
  personId: z.preprocess((v) => {
    if (v == null || v === "") return null;
    return typeof v === "string" ? v.trim() : v;
  }, z.union([z.null(), z.string().cuid()])),
  prospectName: z.string().trim().min(1).max(200),
  meetingAt: z.coerce.date(),
  durationMin: z
    .union([z.literal(""), z.coerce.number().int().min(0).max(24 * 60)])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  transcript: z.string().trim().min(1).max(200_000),
  notes: z
    .string()
    .trim()
    .max(10_000)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  meetingType: z.preprocess(
    (v) => (v == null || v === "" ? null : v),
    z.union([z.null(), z.string().trim().max(120)]),
  ),
  pipelineStage: z.preprocess(
    (v) => (v == null || v === "" ? null : v),
    z.union([z.null(), z.string().trim().max(120)]),
  ),
  potentialAmount: z.preprocess((v) => {
    if (v == null || v === "") return null;
    const n = typeof v === "string" ? Number(v) : Number(v);
    return Number.isFinite(n) ? n : null;
  }, z.union([z.null(), z.number().min(0).max(1e12)])),
  outcome: meetingOutcomeSchema,
});

const meetingIdSchema = z.string().trim().min(1).max(64);

export async function createMeetingAction(formData: FormData) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

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

  const parsed = createMeetingSchema.safeParse({
    personId: formData.get("personId") ?? "",
    prospectName: formData.get("prospectName") ?? "",
    meetingAt: formData.get("meetingAt") ?? "",
    durationMin: formData.get("durationMin") ?? "",
    transcript: formData.get("transcript") ?? "",
    notes: formData.get("notes") ?? "",
    meetingType: formData.get("meetingType") ?? "",
    pipelineStage: formData.get("pipelineStage") ?? "",
    potentialAmount: formData.get("potentialAmount") ?? "",
    outcome: formData.get("outcome") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const result = await createMeetingForOrg(deps, {
    organizationId: ctx.activeOrganizationId,
    sellerInternalUserId: principal.userId,
    personId: parsed.data.personId,
    prospectName: parsed.data.prospectName,
    meetingAt: parsed.data.meetingAt,
    durationMin: parsed.data.durationMin,
    meetingType: parsed.data.meetingType,
    pipelineStage: parsed.data.pipelineStage,
    potentialAmount: parsed.data.potentialAmount,
    transcript: parsed.data.transcript,
    notes: parsed.data.notes,
    outcome: parsed.data.outcome,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error:
        result.error === "INVALID_PERSON"
          ? ("INVALID_PERSON" as const)
          : result.error,
    };
  }

  revalidatePath("/company/rendez-vous");
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  return { ok: true as const, meetingId: result.meetingId };
}

export async function deleteMeetingAction(meetingId: string) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

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

  const existing = await deps.meetings.findMeetingByIdForOrg({
    id: parsedId.data,
    organizationId: ctx.activeOrganizationId,
  });
  if (!existing) return { ok: false as const, error: "NOT_FOUND" };

  if (!ctx.canManageOrganization) {
    if (existing.sellerUserId !== principal.userId) {
      return { ok: false as const, error: "FORBIDDEN" };
    }
  }

  await deps.meetings.deleteMeetingByIdForOrg({
    id: existing.id,
    organizationId: ctx.activeOrganizationId,
  });

  revalidatePath("/company/rendez-vous");
  revalidatePath("/company/analyse");
  revalidatePath("/company");
  return { ok: true as const };
}
