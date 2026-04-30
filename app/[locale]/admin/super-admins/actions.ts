"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

export type SuperAdminInviteActionResult =
  | { ok: true }
  | { ok: false; message: string };

async function requireSuperAdmin(): Promise<
  | { ok: true; actorUserId: string }
  | { ok: false; message: string }
> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, message: "Non authentifié." };
  }
  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: {
      systemRoles: { select: { role: true } },
    },
  });
  const isSuper = user?.systemRoles.some((r) => r.role === "SUPER_ADMIN");
  if (!isSuper) {
    return { ok: false, message: "Accès réservé aux super administrateurs." };
  }
  return { ok: true, actorUserId: principal.userId };
}

const inviteSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
});

export async function inviteSuperAdminAction(
  raw: z.input<typeof inviteSchema>,
): Promise<SuperAdminInviteActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Adresse e-mail invalide." };
  }

  const email = parsed.data.email;

  const existingRole = await prisma.user.findFirst({
    where: {
      email,
      systemRoles: { some: { role: "SUPER_ADMIN" } },
    },
    select: { id: true },
  });
  if (existingRole) {
    return {
      ok: false,
      message: "Cet utilisateur est déjà super administrateur.",
    };
  }

  const pending = await prisma.superAdminInvitation.findFirst({
    where: {
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (pending) {
    return {
      ok: false,
      message: "Une invitation est déjà en cours pour cette adresse.",
    };
  }

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.superAdminInvitation.create({
    data: {
      email,
      tokenHash: hashToken(rawToken),
      expiresAt,
      invitedByUserId: gate.actorUserId,
    },
  });

  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/super-admin-invitations/${encodeURIComponent(rawToken)}`;

  await sendTransactionalEmail({
    to: email,
    subject: "Invitation super administrateur — Sales Time",
    html: `<p>Vous êtes invité à devenir <strong>super administrateur</strong> de la plateforme Sales Time (accès système : organisations, prompts, analytics).</p><p><a href="${link}">Accepter l’invitation</a></p><p>Ce lien expire dans 14 jours. Vous devez vous connecter avec l’adresse <strong>${email}</strong>.</p>`,
  });

  revalidatePath("/admin/super-admins");
  return { ok: true };
}

export async function revokeSuperAdminInvitationAction(
  invitationId: string,
): Promise<SuperAdminInviteActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const idParsed = z.string().cuid().safeParse(invitationId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const inv = await prisma.superAdminInvitation.findFirst({
    where: { id: idParsed.data, status: "PENDING" },
  });
  if (!inv) {
    return { ok: false, message: "Invitation introuvable ou déjà traitée." };
  }

  await prisma.superAdminInvitation.update({
    where: { id: inv.id },
    data: { status: "REVOKED" },
  });

  revalidatePath("/admin/super-admins");
  return { ok: true };
}

export async function revokeSuperAdminRoleAction(
  targetUserId: string,
): Promise<SuperAdminInviteActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  if (targetUserId === gate.actorUserId) {
    return {
      ok: false,
      message: "Vous ne pouvez pas révoquer votre propre rôle.",
    };
  }

  const idParsed = z.string().cuid().safeParse(targetUserId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const role = await prisma.systemRole.findFirst({
    where: { userId: idParsed.data, role: "SUPER_ADMIN" },
    include: { user: { select: { email: true } } },
  });
  if (!role) {
    return { ok: false, message: "Ce rôle est introuvable." };
  }

  await prisma.systemRole.delete({ where: { id: role.id } });

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: "REVOKE_SUPER_ADMIN",
      reason: `Révoqué le rôle super admin de ${role.user.email}`,
    },
  });

  revalidatePath("/admin/super-admins");
  return { ok: true };
}
