"use server";

import { revalidatePath } from "next/cache";
import { getApplicationDeps } from "@/lib/application-deps";

export async function updateFeedbackStatusAction(input: {
  id: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX";
}) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false as const };
  }

  await deps.feedbacks.updateStatus({
    id: input.id,
    status: input.status,
  });

  revalidatePath("/admin/feedbacks");
  return { ok: true as const };
}
