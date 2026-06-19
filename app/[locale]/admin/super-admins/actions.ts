"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireSuperAdminActor } from "@/src/core/application/require-super-admin";

export type SuperAdminInviteActionResult =
  | { ok: true }
  | { ok: false; message: string };

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
});

export async function inviteSuperAdminAction(
  raw: z.input<typeof inviteSchema>,
): Promise<SuperAdminInviteActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Adresse e-mail invalide." };
  }

  const email = parsed.data.email;

  const existingRole =
    await deps.backoffice.findUserWithSuperAdminByEmail(email);
  if (existingRole) {
    return {
      ok: false,
      message: "Cet utilisateur est déjà super administrateur.",
    };
  }

  const pending =
    await deps.backoffice.findPendingSuperAdminInvitationByEmail(email);
  if (pending) {
    return {
      ok: false,
      message: "Une invitation est déjà en cours pour cette adresse.",
    };
  }

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await deps.backoffice.createSuperAdminInvitation({
    email,
    tokenHash: hashToken(rawToken),
    expiresAt,
    invitedByUserId: gate.actorUserId,
  });

  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/super-admin-invitations/${encodeURIComponent(rawToken)}`;

  await sendTransactionalEmail({
    to: email,
    subject: "Invitation super administrateur — Sales Time",
    html: `<p>Vous êtes invité à devenir <strong>super administrateur</strong> de la plateforme Sales Time (accès système : organisations, prompts, analytics).</p><p><a href="${link}">Accepter l’invitation</a></p><p>Ce lien expire dans 14 jours. Vous devez vous connecter avec l’adresse <strong>${email}</strong>.</p>`,
  });

  await deps.audit.logPlatformAction({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: "INVITE_SUPER_ADMIN",
    reason: `Invitation super admin envoyée à ${email}`,
  });

  revalidatePath("/admin/super-admins");
  return { ok: true };
}

export async function revokeSuperAdminInvitationAction(
  invitationId: string,
): Promise<SuperAdminInviteActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const idParsed = z.string().cuid().safeParse(invitationId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const inv = await deps.backoffice.findPendingSuperAdminInvitationById(
    idParsed.data,
  );
  if (!inv) {
    return { ok: false, message: "Invitation introuvable ou déjà traitée." };
  }

  await deps.backoffice.revokeSuperAdminInvitation(inv.id);

  await deps.audit.logPlatformAction({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: "REVOKE_SUPER_ADMIN_INVITE",
    reason: `Invitation super admin annulée pour ${inv.email}`,
  });

  revalidatePath("/admin/super-admins");
  return { ok: true };
}

export async function revokeSuperAdminRoleAction(
  targetUserId: string,
): Promise<SuperAdminInviteActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
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

  const role = await deps.backoffice.findSuperAdminSystemRoleForUser(
    idParsed.data,
  );
  if (!role) {
    return { ok: false, message: "Ce rôle est introuvable." };
  }

  await deps.backoffice.deleteSystemRole(role.roleRecordId);

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: "REVOKE_SUPER_ADMIN",
    reason: `Révoqué le rôle super admin de ${role.userEmail}`,
  });

  revalidatePath("/admin/super-admins");
  return { ok: true };
}
