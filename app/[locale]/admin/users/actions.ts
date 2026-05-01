"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireSuperAdminActor } from "@/src/core/application/require-super-admin";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function bulkToggleUserStatusAction(
  userIds: string[],
  status: "ACTIVE" | "DISABLED",
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  if (userIds.length === 0) return { ok: false, message: "Aucun ID fourni." };

  const users = await deps.backoffice.findUsersByIdsForBulk(userIds);

  if (users.length === 0)
    return { ok: false, message: "Aucun utilisateur trouvé." };

  await deps.backoffice.updateUsersStatusMany(userIds, status);

  await deps.backoffice.createSuperAdminAuditLogsMany(
    users.map((u) => ({
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: status === "DISABLED" ? "BLOCK_USER" : "UNBLOCK_USER",
      reason: `${status === "DISABLED" ? "Bloqué" : "Débloqué"} (bulk) l'utilisateur ${u.email}`,
    })),
  );

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserStatusAction(
  userId: string,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const user = await deps.backoffice.findUserStatusById(userId);
  if (!user) return { ok: false, message: "Utilisateur introuvable." };

  const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

  await deps.backoffice.updateUserStatus(userId, newStatus);

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: newStatus === "DISABLED" ? "BLOCK_USER" : "UNBLOCK_USER",
    reason: `${newStatus === "DISABLED" ? "Bloqué" : "Débloqué"} l'utilisateur ${user.email}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().trim().max(100).nullable(),
  lastName: z.string().trim().max(100).nullable(),
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
});

export async function updateUserAction(
  raw: z.input<typeof updateUserSchema>,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const user = await deps.backoffice.findUserByIdExists(parsed.data.id);
  if (!user) return { ok: false, message: "Utilisateur introuvable." };

  const emailConflict = await deps.backoffice.findUserEmailConflict(
    parsed.data.email,
    parsed.data.id,
  );
  if (emailConflict) {
    return { ok: false, message: "Cet e-mail est déjà utilisé." };
  }

  await deps.backoffice.updateUserProfile({
    userId: parsed.data.id,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
  });

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: "UPDATE_USER",
    reason: `Mis à jour : ${parsed.data.email}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const user = await deps.backoffice.findUserForDelete(userId);
  if (!user) return { ok: false, message: "Utilisateur introuvable." };

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: "DELETE_USER",
    reason: `Supprimé l'utilisateur ${user.email}`,
  });

  await deps.backoffice.deleteUserById(userId);

  revalidatePath("/admin/users");
  return { ok: true };
}

const inviteToOrgSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
  organizationId: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function inviteUserToOrgAction(
  raw: z.input<typeof inviteToOrgSchema>,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const parsed = inviteToOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const org = await deps.backoffice.findOrganizationNameById(
    parsed.data.organizationId,
  );
  if (!org) return { ok: false, message: "Organisation introuvable." };

  const existing = await deps.backoffice.findPendingOrganizationInvitation(
    parsed.data.email,
    parsed.data.organizationId,
  );
  if (existing) {
    return {
      ok: false,
      message: "Une invitation est déjà en cours pour cette adresse.",
    };
  }

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await deps.backoffice.createOrganizationInvitationAdmin({
    email: parsed.data.email,
    organizationId: parsed.data.organizationId,
    role: parsed.data.role,
    tokenHash: hashToken(rawToken),
    expiresAt,
    invitedByUserId: gate.actorUserId,
  });

  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/invitations/${encodeURIComponent(rawToken)}`;

  await sendTransactionalEmail({
    to: parsed.data.email,
    subject: `Invitation à rejoindre ${org.name} — Sales Time`,
    html: `<p>Vous êtes invité à rejoindre <strong>${org.name}</strong> sur Sales Time.</p><p><a href="${link}">Accepter l'invitation</a></p><p>Ce lien expire dans 14 jours.</p>`,
  });

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: parsed.data.organizationId,
    action: "INVITE_USER_TO_ORG",
    reason: `Invité ${parsed.data.email} dans ${org.name} (rôle: ${parsed.data.role})`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
