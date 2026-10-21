"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { getTeamMemberPerformanceProfile } from "@/src/core/application/get-team-member-performance-profile";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import {
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  parseStatsWindowRange,
  statsWindowBounds,
  statsWindowFromRange,
  type StatsWindow,
} from "@/src/core/domain/dashboard-stats-window";
import { memberNameLine } from "@/src/core/domain/member-name-line";
import {
  membersToAttach,
  resolveManagerAssignment,
} from "@/src/core/domain/manager-assignment";

const userIdSchema = z.string().cuid();

async function assertCanViewSellerPerformance(userId: string) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const parsedUserId = userIdSchema.safeParse(userId);
  if (!parsedUserId.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  /*
    Deux lecteurs recevables, et un seul chemin : le manager qui ouvre la fiche
    d'un de ses commerciaux, et le commercial qui lit la sienne. La fiche est
    devenue le même écran pour les deux, et la carte de profil qui l'habite
    appelle ces deux actions pour se rafraîchir ; réservée au rôle
    administrateur, elle laissait le commercial devant un profil qui ne se
    recalculait jamais.

    L'identifiant se valide avant le rôle, puisque c'est lui qu'on compare
    désormais à celui du lecteur.
  */
  const litSaPropreFiche = actor.internalUserId === parsedUserId.data;
  if (actor.workspaceRoleMode !== "admin" && !litSaPropreFiche) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const member = await actor.deps.organizationTeam.findMembershipForManagerView(
    actor.organizationId,
    parsedUserId.data,
  );
  if (!member) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const nameLine = memberNameLine(member.user);

  return {
    ok: true as const,
    deps: actor.deps,
    organizationId: actor.organizationId,
    userId: parsedUserId.data,
    sellerDisplayName: nameLine,
  };
}

/** La période que le client renvoie : des dates de calendrier relues ici, jamais crues. */
function statsWindowFromClient(
  statsWindowDays: number,
  range: { from: string; to: string } | null | undefined,
): StatsWindow {
  const parsed = range ? parseStatsWindowRange(range.from, range.to) : null;
  if (parsed) return statsWindowFromRange(parsed);
  return { days: parseStatsWindowDays(String(statsWindowDays)), range: null };
}

export async function getTeamMemberPerformanceFingerprintAction(
  userId: string,
  statsWindowDays: number,
  statsWindowRange?: { from: string; to: string } | null,
) {
  const access = await assertCanViewSellerPerformance(userId);
  if (!access.ok) return access;

  const window = statsWindowFromClient(statsWindowDays, statsWindowRange);
  const windowDays = window.days;
  const { previousSince: sincePreviousWindow } = statsWindowBounds(window);
  const meetingsForWindow =
    await access.deps.meetings.listRecentMeetingsForDashboard({
      organizationId: access.organizationId,
      limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
      meetingAtSince: sincePreviousWindow,
      sellerUserId: access.userId,
      includeLatestSoncasResult: false,
      includeLatestDiscResult: false,
      includeLatestKissResult: false,
    });
  const { currentWindow: meetings } = partitionMeetingsByStatsWindow(
    meetingsForWindow,
    windowDays,
    new Date(),
    window.range,
  );

  return {
    ok: true as const,
    fingerprint: teamMemberMeetingsFingerprint(meetings),
    meetingCount: meetings.length,
  };
}

export async function refreshTeamMemberPerformanceAction(
  userId: string,
  statsWindowDays: number,
  statsWindowRange?: { from: string; to: string } | null,
) {
  const access = await assertCanViewSellerPerformance(userId);
  if (!access.ok) return access;
  const window = statsWindowFromClient(statsWindowDays, statsWindowRange);

  const profile = await getTeamMemberPerformanceProfile(access.deps, {
    organizationId: access.organizationId,
    sellerUserId: access.userId,
    sellerDisplayName: access.sellerDisplayName,
    statsWindowDays: window.days,
    statsWindowRange: window.range,
  });

  return { ok: true as const, profile };
}

const attachSchema = z.array(z.string().cuid()).min(1).max(50);

export type AttachToMyTeamResult =
  | { ok: true; attached: number }
  | { ok: false; message: string };

/**
 * Ajoute à l'équipe du manager connecté des commerciaux rattachés à personne.
 *
 * Retour de Thomas du 21 octobre 2026 : rattacher un collaborateur passait
 * par une colonne des paramètres de l'organisation, que rien n'indiquait. Le
 * manager le fait désormais d'un clic depuis son équipe. La règle reste celle
 * du menu des paramètres (`resolveManagerAssignment`), et un commercial déjà
 * rattaché à un autre manager n'est jamais déplacé d'ici.
 */
export async function attachToMyTeamAction(
  memberUserIds: string[],
): Promise<AttachToMyTeamResult> {
  const actor = await requireOrgActor();
  if (
    !actor.ok ||
    actor.workspaceRoleMode !== "admin" ||
    !actor.internalUserId
  ) {
    return { ok: false, message: "Accès refusé." };
  }
  const parsed = attachSchema.safeParse(memberUserIds);
  if (!parsed.success) return { ok: false, message: "Identifiant invalide." };

  const managerUserId = actor.internalUserId;
  const { members } =
    await actor.deps.organizationTeam.listMembersAndPendingInvitations(
      actor.organizationId,
    );
  const libres = new Set(
    membersToAttach(members, managerUserId).map((m) => m.userId),
  );

  let attached = 0;
  for (const memberUserId of parsed.data) {
    if (!libres.has(memberUserId)) continue;
    const decision = resolveManagerAssignment({
      members,
      memberUserId,
      managerUserId,
    });
    if (!decision.ok) continue;
    await actor.deps.users.setManagerUserId({
      userId: memberUserId,
      managerUserId: decision.managerUserId,
    });
    attached += 1;
  }

  if (attached === 0) {
    return {
      ok: false,
      message:
        "Ces personnes ont déjà été ajoutées à une équipe entre-temps. Rechargez la page.",
    };
  }
  revalidatePath("/company");
  revalidatePath("/company/equipe");
  revalidatePath("/company/settings/equipe");
  return { ok: true, attached };
}
