"use server";

import { z } from "zod";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getTeamMemberPerformanceProfile } from "@/src/core/application/get-team-member-performance-profile";
import { teamMemberMeetingsFingerprint } from "@/src/core/application/team-member-meetings-fingerprint";
import { ORG_ADMIN_DASHBOARD_MEETING_CAP } from "@/src/core/application/get-org-admin-dashboard";
import {
  parseStatsWindowDays,
  partitionMeetingsByStatsWindow,
  previousMeetingAtWindowStart,
} from "@/src/core/domain/dashboard-stats-window";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

const userIdSchema = z.string().cuid();

async function assertManagerCanViewSeller(userId: string) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" as const };
  }
  if (ctx.workspaceRoleMode !== "admin") {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const parsedUserId = userIdSchema.safeParse(userId);
  if (!parsedUserId.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const member = await deps.organizationTeam.findMembershipForManagerView(
    ctx.activeOrganizationId,
    parsedUserId.data,
  );
  if (!member) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const nameLine =
    [member.user.firstName?.trim() ?? "", member.user.lastName?.trim() ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim() || member.user.email;

  return {
    ok: true as const,
    deps,
    organizationId: ctx.activeOrganizationId,
    userId: parsedUserId.data,
    sellerDisplayName: nameLine,
  };
}

export async function getTeamMemberPerformanceFingerprintAction(
  userId: string,
  statsWindowDays: number,
) {
  const access = await assertManagerCanViewSeller(userId);
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
  const access = await assertManagerCanViewSeller(userId);
  if (!access.ok) return access;

  const profile = await getTeamMemberPerformanceProfile(access.deps, {
    organizationId: access.organizationId,
    sellerUserId: access.userId,
    sellerDisplayName: access.sellerDisplayName,
    statsWindowDays: parseStatsWindowDays(String(statsWindowDays)),
  });

  return { ok: true as const, profile };
}
