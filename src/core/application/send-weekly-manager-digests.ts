import { weeklyDigestHtml } from "@/lib/email/weekly-digest-html";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import {
  weeklyManagerDigest,
  type DigestMeeting,
} from "@/src/core/domain/weekly-manager-digest";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { NotificationRepositoryPort } from "@/src/core/ports/notification-repository-port";
import type { OrganizationDirectoryPort } from "@/src/core/ports/organization-directory-port";
import type { OrganizationTeamRepositoryPort } from "@/src/core/ports/organization-team-repository-port";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ORGANIZATIONS_CAP = 1000;
const MEETINGS_CAP = 500;

export type SendWeeklyManagerDigestsResult = {
  organizationsSeen: number;
  organizationsWithDigest: number;
  emailsSent: number;
  emailsFailed: number;
};

const dateFr = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

function weekLabel(from: Date, to: Date): string {
  return `semaine du ${dateFr.format(from)} au ${dateFr.format(to)}`;
}

/**
 * Le lundi matin, chaque manager reçoit le bilan de la semaine écoulée.
 *
 * Une organisation sans le moindre rendez-vous sur deux semaines ne reçoit
 * rien : un e-mail vide apprendrait au manager à ne plus ouvrir les autres.
 * Un envoi qui échoue n'arrête pas la tournée des autres organisations.
 */
export async function sendWeeklyManagerDigests(
  deps: {
    orgDirectory: OrganizationDirectoryPort;
    organizationTeam: OrganizationTeamRepositoryPort;
    meetings: MeetingRepositoryPort;
    notifications?: NotificationRepositoryPort;
    sendEmail?: typeof sendTransactionalEmail;
  },
  input: { now: Date; appBaseUrl: string },
): Promise<SendWeeklyManagerDigestsResult> {
  const sendEmail = deps.sendEmail ?? sendTransactionalEmail;
  const weekStart = new Date(input.now.getTime() - WEEK_MS);
  const previousWeekStart = new Date(weekStart.getTime() - WEEK_MS);
  const label = weekLabel(weekStart, input.now);

  const organizations = await deps.orgDirectory.listOrganizations({
    limit: ORGANIZATIONS_CAP,
  });

  const result: SendWeeklyManagerDigestsResult = {
    organizationsSeen: organizations.length,
    organizationsWithDigest: 0,
    emailsSent: 0,
    emailsFailed: 0,
  };

  for (const org of organizations) {
    const { members } =
      await deps.organizationTeam.listMembersAndPendingInvitations(org.id);
    const admins = members.filter((m) => m.role === "ADMIN");
    if (admins.length === 0) continue;

    const [meetings, previousMeetings] = await Promise.all([
      deps.meetings.listRecentMeetingsForDashboard({
        organizationId: org.id,
        meetingAtSince: weekStart,
        meetingAtBefore: input.now,
        limit: MEETINGS_CAP,
      }),
      deps.meetings.listRecentMeetingsForDashboard({
        organizationId: org.id,
        meetingAtSince: previousWeekStart,
        meetingAtBefore: weekStart,
        limit: MEETINGS_CAP,
      }),
    ]);

    const toDigestMeeting = (m: (typeof meetings)[number]): DigestMeeting => ({
      id: m.id,
      prospectName: m.prospectName,
      prospectCompany: m.prospectCompany,
      sellerUserId: m.sellerUserId,
      sellerFirstName: m.sellerFirstName,
      sellerLastName: m.sellerLastName,
      sellerEmail: m.sellerEmail,
      meetingAt: m.meetingAt,
      salesScore: m.salesScore,
      hasKiss: m.hasKiss,
    });

    const digest = weeklyManagerDigest({
      meetings: meetings.map(toDigestMeeting),
      previousMeetings: previousMeetings.map(toDigestMeeting),
      members: members.map((m) => ({
        userId: m.userId,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        role: m.role,
      })),
    });
    if (!digest) continue;
    result.organizationsWithDigest += 1;

    const email = weeklyDigestHtml({
      organizationName: org.name,
      digest,
      baseUrl: input.appBaseUrl,
      weekLabel: label,
    });

    for (const admin of admins) {
      try {
        await sendEmail({
          to: admin.email,
          subject: email.subject,
          html: email.html,
        });
        result.emailsSent += 1;
      } catch (cause) {
        result.emailsFailed += 1;
        console.error("weekly digest: email failed", {
          organizationId: org.id,
          to: admin.email,
          cause,
        });
      }

      await deps.notifications
        ?.create({
          organizationId: org.id,
          userId: admin.userId,
          title: "Bilan de la semaine",
          body: `${digest.meetingsCount} rendez-vous, ${digest.analyzedCount} analysés. ${digest.averageSalesScore != null ? `SalesScore moyen ${digest.averageSalesScore}/100.` : ""}`.trim(),
          href: "/company",
        })
        .catch(() => undefined);
    }
  }

  return result;
}
