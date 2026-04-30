"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

type ActionResult = { ok: true } | { ok: false; message: string };

async function requireSuperAdmin(): Promise<
  { ok: true; actorUserId: string } | { ok: false; message: string }
> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false, message: "Non authentifié." };
  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: { systemRoles: { select: { role: true } } },
  });
  if (!user?.systemRoles.some((r) => r.role === "SUPER_ADMIN")) {
    return { ok: false, message: "Accès réservé aux super administrateurs." };
  }
  return { ok: true, actorUserId: principal.userId };
}

export async function bulkToggleUserStatusAction(
  userIds: string[],
  status: "ACTIVE" | "DISABLED",
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  if (userIds.length === 0) return { ok: false, message: "Aucun ID fourni." };

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });

  if (users.length === 0) return { ok: false, message: "Aucun utilisateur trouvé." };

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { status },
  });

  await prisma.superAdminAuditLog.createMany({
    data: users.map((u) => ({
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: status === "DISABLED" ? "BLOCK_USER" : "UNBLOCK_USER",
      reason: `${status === "DISABLED" ? "Bloqué" : "Débloqué"} (bulk) l'utilisateur ${u.email}`,
    })),
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserStatusAction(
  userId: string,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, email: true },
  });
  if (!user) return { ok: false, message: "Utilisateur introuvable." };

  const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
  });

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: newStatus === "DISABLED" ? "BLOCK_USER" : "UNBLOCK_USER",
      reason: `${newStatus === "DISABLED" ? "Bloqué" : "Débloqué"} l'utilisateur ${user.email}`,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().trim().max(100).nullable(),
  lastName: z.string().trim().max(100).nullable(),
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
});

export async function updateUserAction(
  raw: z.input<typeof updateUserSchema>,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.id } });
  if (!user) return { ok: false, message: "Utilisateur introuvable." };

  const emailConflict = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: parsed.data.id } },
  });
  if (emailConflict) {
    return { ok: false, message: "Cet e-mail est déjà utilisé." };
  }

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
    },
  });

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: "UPDATE_USER",
      reason: `Mis à jour : ${parsed.data.email}`,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return { ok: false, message: "Utilisateur introuvable." };

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: "DELETE_USER",
      reason: `Supprimé l'utilisateur ${user.email}`,
    },
  });

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { ok: true };
}

const inviteToOrgSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  organizationId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function inviteUserToOrgAction(
  raw: z.input<typeof inviteToOrgSchema>,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = inviteToOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const org = await prisma.organization.findUnique({
    where: { id: parsed.data.organizationId },
  });
  if (!org) return { ok: false, message: "Organisation introuvable." };

  const existing = await prisma.organizationInvitation.findFirst({
    where: {
      email: parsed.data.email,
      organizationId: parsed.data.organizationId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    return { ok: false, message: "Une invitation est déjà en cours pour cette adresse." };
  }

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.organizationInvitation.create({
    data: {
      email: parsed.data.email,
      organizationId: parsed.data.organizationId,
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
    to: parsed.data.email,
    subject: `Invitation à rejoindre ${org.name} — Sales Time`,
    html: `<p>Vous êtes invité à rejoindre <strong>${org.name}</strong> sur Sales Time.</p><p><a href="${link}">Accepter l'invitation</a></p><p>Ce lien expire dans 14 jours.</p>`,
  });

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: parsed.data.organizationId,
      action: "INVITE_USER_TO_ORG",
      reason: `Invité ${parsed.data.email} dans ${org.name} (rôle: ${parsed.data.role})`,
    },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
