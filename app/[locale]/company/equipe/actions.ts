"use server";

import { z } from "zod";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { getTeamMemberPerformanceProfile } from "@/src/core/application/get-team-member-performance-profile";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import {
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import { memberNameLine } from "@/src/core/domain/member-name-line";

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

export async function getTeamMemberPerformanceFingerprintAction(
  userId: string,
  statsWindowDays: number,
) {
  const access = await assertCanViewSellerPerformance(userId);
  if (!access.ok) return access;

  const windowDays = parseStatsWindowDays(String(statsWindowDays));
  const sincePreviousWindow = previousMeetingAtWindowStart(windowDays);
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
) {
  const access = await assertCanViewSellerPerformance(userId);
  if (!access.ok) return access;

  const profile = await getTeamMemberPerformanceProfile(access.deps, {
    organizationId: access.organizationId,
    sellerUserId: access.userId,
    sellerDisplayName: access.sellerDisplayName,
    statsWindowDays: parseStatsWindowDays(String(statsWindowDays)),
  });

  return { ok: true as const, profile };
}
