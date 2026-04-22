"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { createMeetingForOrg } from "@/src/core/application/create-meeting";
import type { MeetingOutcome } from "@/lib/generated/prisma/enums";

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

  const prospectName = String(formData.get("prospectName") ?? "").trim();
  const meetingAtRaw = String(formData.get("meetingAt") ?? "");
  const durationRaw = String(formData.get("durationMin") ?? "").trim();
  const transcript = String(formData.get("transcript") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "") as MeetingOutcome;

  if (!prospectName || !meetingAtRaw || !transcript.trim()) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const meetingAt = new Date(meetingAtRaw);
  if (Number.isNaN(meetingAt.getTime())) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const allowed: MeetingOutcome[] = [
    "WON",
    "LOST",
    "FOLLOW_UP",
    "NO_SHOW",
    "OTHER",
  ];
  if (!allowed.includes(outcome)) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const durationMin =
    durationRaw === "" ? null : Number.parseInt(durationRaw, 10);
  if (durationMin !== null && Number.isNaN(durationMin)) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const result = await createMeetingForOrg(deps, {
    clerkOrgId: ctx.activeTenantClerkOrgId,
    sellerInternalUserId: userRow.id,
    prospectName,
    meetingAt,
    durationMin,
    transcript,
    notes: notes || null,
    outcome,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard/rendez-vous");
  revalidatePath("/dashboard/analyse");
  revalidatePath("/dashboard");
  return { ok: true as const, meetingId: result.meetingId };
}
