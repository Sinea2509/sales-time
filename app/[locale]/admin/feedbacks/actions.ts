"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "WONT_FIX"]),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export async function updateFeedbackStatusAction(input: z.infer<typeof updateSchema>) {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false as const };
  }

  await deps.feedbacks.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    adminNotes: parsed.data.adminNotes,
  });

  await deps.audit.logPlatformAction({
    actorUserId: principal.userId,
    organizationId: "system",
    action: "UPDATE_FEEDBACK",
    reason: `Feedback ${parsed.data.id} → ${parsed.data.status}`,
  });

  revalidatePath("/admin/feedbacks");
  return { ok: true as const };
}
