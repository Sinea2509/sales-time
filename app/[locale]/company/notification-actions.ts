"use server";

import { revalidatePath } from "next/cache";
import { getApplicationDeps } from "@/lib/application-deps";

export async function markNotificationReadAction(notificationId: string) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  await deps.notifications.markRead({
    id: notificationId,
    userId: principal.userId,
  });

  revalidatePath("/company", "layout");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  await deps.notifications.markAllRead(principal.userId);
  revalidatePath("/company", "layout");
  return { ok: true as const };
}
