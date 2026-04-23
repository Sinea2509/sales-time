"use server";

import { redirect } from "next/navigation";
import { setActiveOrganizationCookie } from "@/lib/auth/session-cookie";
import { hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

export type AcceptInviteResult =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "INVALID" | "EMAIL_MISMATCH" | "EXPIRED";
    };

export async function acceptOrganizationInvitationAction(
  token: string,
): Promise<AcceptInviteResult> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const th = hashToken(token);
  const inv = await prisma.organizationInvitation.findFirst({
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
    prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: principal.userId,
          organizationId: inv.organizationId,
        },
      },
      create: {
        userId: principal.userId,
        organizationId: inv.organizationId,
        role: inv.role,
      },
      update: { role: inv.role },
    }),
    prisma.organizationInvitation.update({
      where: { id: inv.id },
      data: {
        status: "ACCEPTED",
        acceptedByUserId: principal.userId,
      },
    }),
  ]);

  await setActiveOrganizationCookie(inv.organizationId);
  redirect("/company");
}
