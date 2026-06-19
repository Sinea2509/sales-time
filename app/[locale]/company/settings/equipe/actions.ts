"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { buildInvitationEmailHtml } from "@/lib/invite-email-html";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsActor } from "@/lib/load-org-settings-access";
import { resolveOrganizationInviteRole } from "@/src/core/domain/organization-invite-policy";
import type { OrganizationMembershipRole } from "@/src/core/domain/organization-membership-role";

async function requireOrgSettingsAccess() {
  const actor = await loadOrgSettingsActor();
  if (!actor) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  return {
    ok: true as const,
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    actorRole: actor.role,
    canManageOrganizationSettings: actor.canManageOrganizationSettings,
    organizationHasManager: actor.organizationHasManager,
  };
}

async function requireOrgAdmin() {
  const gate = await requireOrgSettingsAccess();
  if (!gate.ok) return gate;
  if (!gate.canManageOrganizationSettings) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }
  return gate;
}

export type TeamActionResult = { ok: true } | { ok: false; message: string };

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function inviteMemberAction(
  raw: z.input<typeof inviteSchema>,
): Promise<TeamActionResult> {
  const gate = await requireOrgSettingsAccess();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "E-mail ou rôle invalide." };
  }

  const inviteRole = resolveOrganizationInviteRole({
    actorRole: gate.actorRole,
    requestedRole: parsed.data.role,
    organizationHasManager: gate.organizationHasManager,
  });
  if (!inviteRole) {
    return {
      ok: false,
      message: "Vous ne pouvez inviter que des membres de votre rôle.",
    };
  }

  const deps = getApplicationDeps();
  const email = parsed.data.email.toLowerCase();
  if (email === gate.actorEmail.trim().toLowerCase()) {
    return { ok: false, message: "Vous ne pouvez pas vous inviter vous-même." };
  }

  const existingUserId = await deps.organizationTeam.findUserIdByEmail(email);
  if (existingUserId) {
    const already = await deps.organizationTeam.findMembership(
      existingUserId,
      gate.organizationId,
    );
    if (already) {
      return {
        ok: false,
        message: "Cet utilisateur est déjà membre de l’organisation.",
      };
    }
  }

  const pending = await deps.organizationTeam.findPendingInvitationForEmail(
    gate.organizationId,
    email,
  );
  if (pending) {
    return {
      ok: false,
      message: "Une invitation est déjà en cours pour cette adresse.",
    };
  }

  const orgName =
    (await deps.organizationTeam.getOrganizationName(gate.organizationId)) ??
    "Sales Time";

  const rawToken = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await deps.organizationTeam.createPendingInvitation({
    organizationId: gate.organizationId,
    email,
    role: inviteRole,
    tokenHash: hashToken(rawToken),
    expiresAt,
    invitedByUserId: gate.actorUserId,
  });

  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/invitations/${encodeURIComponent(rawToken)}`;

  await sendTransactionalEmail({
    to: email,
    subject: `Invitation — ${orgName}`,
    html: buildInvitationEmailHtml({
      organizationName: orgName,
      inviteLink: link,
      bodyHtml: "",
    }),
  });

  revalidatePath("/company/settings/equipe");
  revalidatePath("/company");
  return { ok: true };
}

export async function changeRoleAction(
  membershipId: string,
  role: OrganizationMembershipRole,
): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const idParsed = z.string().cuid().safeParse(membershipId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const deps = getApplicationDeps();
  const membership = await deps.organizationTeam.findMembershipWithUserEmail(
    idParsed.data,
    gate.organizationId,
  );
  if (!membership) {
    return { ok: false, message: "Membre introuvable." };
  }

  if (role === "MEMBER" && membership.role === "ADMIN") {
    const adminCount = await deps.organizationTeam.countAdminsInOrganization(
      gate.organizationId,
    );
    if (adminCount <= 1) {
      return {
        ok: false,
        message:
          "Impossible de retirer le dernier manager de l’organisation.",
      };
    }
  }

  await deps.organizationTeam.updateMembershipRole(membership.id, role);

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}

export async function removeMemberAction(
  membershipId: string,
): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const idParsed = z.string().cuid().safeParse(membershipId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const deps = getApplicationDeps();
  const membership = await deps.organizationTeam.findMembershipByIdForOrg(
    idParsed.data,
    gate.organizationId,
  );
  if (!membership) {
    return { ok: false, message: "Membre introuvable." };
  }

  if (membership.userId === gate.actorUserId) {
    return {
      ok: false,
      message: "Vous ne pouvez pas retirer votre propre accès.",
    };
  }

  if (membership.role === "ADMIN") {
    const adminCount = await deps.organizationTeam.countAdminsInOrganization(
      gate.organizationId,
    );
    if (adminCount <= 1) {
      return {
        ok: false,
        message: "Impossible de retirer le dernier manager.",
      };
    }
  }

  await deps.organizationTeam.deleteMembership(membership.id);

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}

export async function revokeInvitationAction(
  invitationId: string,
): Promise<TeamActionResult> {
  const gate = await requireOrgAdmin();
  if (!gate.ok) return { ok: false, message: "Accès refusé." };

  const idParsed = z.string().cuid().safeParse(invitationId);
  if (!idParsed.success) {
    return { ok: false, message: "Identifiant invalide." };
  }

  const deps = getApplicationDeps();
  const inv = await deps.organizationTeam.findPendingInvitationByIdForOrg(
    idParsed.data,
    gate.organizationId,
  );
  if (!inv) {
    return { ok: false, message: "Invitation introuvable ou déjà traitée." };
  }

  await deps.organizationTeam.revokeInvitation(inv.id);

  revalidatePath("/company/settings/equipe");
  return { ok: true };
}
