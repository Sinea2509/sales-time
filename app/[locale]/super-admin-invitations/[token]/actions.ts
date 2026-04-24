"use server";

import { redirect } from "next/navigation";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

export type AcceptSuperAdminInviteResult =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "INVALID" | "EMAIL_MISMATCH" | "EXPIRED";
    };

export async function acceptSuperAdminInvitationAction(
  token: string,
): Promise<AcceptSuperAdminInviteResult> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const th = hashToken(token);
  const inv = await prisma.superAdminInvitation.findFirst({
    where: {
      tokenHash: th,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (!inv) {
    return { ok: false, error: "INVALID" };
  }

  if (principal.email.toLowerCase() !== inv.email.toLowerCase()) {
    return { ok: false, error: "EMAIL_MISMATCH" };
  }

  await prisma.$transaction([
    prisma.systemRole.upsert({
      where: {
        userId_role: { userId: principal.userId, role: "SUPER_ADMIN" },
      },
      create: { userId: principal.userId, role: "SUPER_ADMIN" },
      update: {},
    }),
    prisma.superAdminInvitation.update({
      where: { id: inv.id },
      data: {
        status: "ACCEPTED",
        acceptedByUserId: principal.userId,
      },
    }),
  ]);

  redirect("/admin");
}
