"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

async function requireOrgAdmin() {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevatedOrganizationId: superAdminOrg },
  );
  if (
    ctx.kind !== "authenticated" ||
    !ctx.activeOrganizationId ||
    !ctx.canManageOrganization
  ) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return {
    ok: true as const,
    organizationId: ctx.activeOrganizationId,
    actorUserId: principal.userId,
  };
}

export type TeamActionResult = { ok: true } | { ok: false; message: string };

export async function inviteMemberAction(
  raw: z.input<typeof inviteSchema>,
): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "E-mail ou rôle invalide." };
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    const already = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: gate.organizationId,
        },
      },
    });
    if (already) {
      return { ok: false, message: "Cet utilisateur est déjà membre de l’organisation." };
    }
  }

  const pending = await prisma.organizationInvitation.findFirst({
    where: {
      organizationId: gate.organizationId,
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (pending) {
    return { ok: false, message: "Une invitation est déjà en cours pour cette adresse." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: gate.organizationId },
    select: { name: true },
  });
  const orgName = org?.name ?? "Sales Time";

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.organizationInvitation.create({
    data: {
      organizationId: gate.organizationId,
      email,
      role: parsed.data.role,
      tokenHash: hashToken(rawToken),
      expiresAt,
      invitedByUserId: gate.actorUserId,
    },
  });

  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/invitations/${encodeURIComponent(rawToken)}`;

  await sendTransactionalEmail({
    to: email,
    subject: `Invitation — ${orgName}`,
    html: `<p>Vous êtes invité à rejoindre <strong>${orgName}</strong> sur Sales Time.</p><p><a href="${link}">Accepter l’invitation</a></p>`,
  });

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}

const inviteSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function changeRoleAction(
  membershipId: string,
  role: "ADMIN" | "MEMBER",
): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const idParsed = z.string().cuid().safeParse(membershipId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { id: idParsed.data, organizationId: gate.organizationId },
    include: { user: { select: { email: true } } },
  });
  if (!membership) {
    return { ok: false, message: "Membre introuvable." };
  }

  if (role === "MEMBER" && membership.role === "ADMIN") {
    const adminCount = await prisma.organizationMembership.count({
      where: { organizationId: gate.organizationId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return {
        ok: false,
        message: "Impossible de retirer le dernier administrateur de l’organisation.",
      };
    }
  }

  await prisma.organizationMembership.update({
    where: { id: membership.id },
    data: { role },
  });

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}

export async function removeMemberAction(membershipId: string): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const idParsed = z.string().cuid().safeParse(membershipId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: { id: idParsed.data, organizationId: gate.organizationId },
  });
  if (!membership) {
    return { ok: false, message: "Membre introuvable." };
  }

  if (membership.userId === gate.actorUserId) {
    return { ok: false, message: "Vous ne pouvez pas retirer votre propre accès." };
  }

  if (membership.role === "ADMIN") {
    const adminCount = await prisma.organizationMembership.count({
      where: { organizationId: gate.organizationId, role: "ADMIN" },
    });
    if (adminCount <= 1) {
      return {
        ok: false,
        message: "Impossible de retirer le dernier administrateur.",
      };
    }
  }

  await prisma.organizationMembership.delete({
    where: { id: membership.id },
  });

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}

export async function revokeInvitationAction(invitationId: string): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const idParsed = z.string().cuid().safeParse(invitationId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const inv = await prisma.organizationInvitation.findFirst({
    where: {
      id: idParsed.data,
      organizationId: gate.organizationId,
      status: "PENDING",
    },
  });
  if (!inv) {
    return { ok: false, message: "Invitation introuvable ou déjà traitée." };
  }

  await prisma.organizationInvitation.update({
    where: { id: inv.id },
    data: { status: "REVOKED" },
  });

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}
