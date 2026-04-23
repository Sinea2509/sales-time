"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
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
  outcome: meetingOutcomeSchema,
});

const meetingIdSchema = z.string().trim().min(1).max(64);

export async function createMeetingAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "UNAUTHENTICATED" };

  await ensureClerkUserSynced(userId);
  const userRow = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!userRow) return { ok: false as const, error: "NO_USER" };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrg,
  });
  if (ctx.kind !== "authenticated" || !ctx.activeTenantClerkOrgId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const parsed = createMeetingSchema.safeParse({
    prospectName: formData.get("prospectName") ?? "",
    meetingAt: formData.get("meetingAt") ?? "",
    durationMin: formData.get("durationMin") ?? "",
    transcript: formData.get("transcript") ?? "",
    notes: formData.get("notes") ?? "",
    outcome: formData.get("outcome") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const result = await createMeetingForOrg(deps, {
    clerkOrgId: ctx.activeTenantClerkOrgId,
    sellerInternalUserId: userRow.id,
    prospectName: parsed.data.prospectName,
    meetingAt: parsed.data.meetingAt,
    durationMin: parsed.data.durationMin,
    transcript: parsed.data.transcript,
    notes: parsed.data.notes,
    outcome: parsed.data.outcome,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard/rendez-vous");
  revalidatePath("/dashboard/analyse");
  revalidatePath("/dashboard");
  return { ok: true as const, meetingId: result.meetingId };
}

export async function deleteMeetingAction(meetingId: string) {
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "UNAUTHENTICATED" };

  await ensureClerkUserSynced(userId);

  const userRow = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!userRow) return { ok: false as const, error: "NO_USER" };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrg,
  });
  if (ctx.kind !== "authenticated" || !ctx.activeTenantClerkOrgId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const existing = await prisma.meeting.findFirst({
    where: { id: parsedId.data, clerkOrgId: ctx.activeTenantClerkOrgId },
    select: { id: true, sellerUserId: true },
  });
  if (!existing) return { ok: false as const, error: "NOT_FOUND" };

  if (!ctx.canManageOrganization) {
    if (existing.sellerUserId !== userRow.id) {
      return { ok: false as const, error: "FORBIDDEN" };
    }
  }

  await prisma.meeting.delete({ where: { id: existing.id } });

  revalidatePath("/dashboard/rendez-vous");
  revalidatePath("/dashboard/analyse");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
