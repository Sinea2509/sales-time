"use client";

import type { WorkspaceRoleMode } from "@/src/core/domain/authorization-policy";
import type { NotificationItem } from "@/components/organisms/notification-bell";
import type { OrgSwitcherMembership } from "@/components/organisms/org-switcher";
import type { SessionUserMenuInfo } from "@/components/organisms/dashboard-header";
import { FeedbackCaptureProvider } from "@/components/providers/feedback-capture-provider";
import { OrgCommercialDashboardShell } from "@/components/templates/org-commercial-dashboard-shell";
import { OrgManagerDashboardShell } from "@/components/templates/org-manager-dashboard-shell";
import { MeetingCreateDialog } from "@/components/organisms/meeting-create-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type OrgDashboardShellProps = {
  children: React.ReactNode;
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedOrganizationId: string | null;
  activeOrganizationId: string | null;
  workspaceRoleMode: WorkspaceRoleMode | null;
  trialAnalysesLeft: number;
  trialLimit: number;
  planUnlocked: boolean;
  unreadNotificationCount: number;
  notifications: NotificationItem[];
  organizationSwitcherMemberships: OrgSwitcherMembership[];
  sessionUser: SessionUserMenuInfo;
};

export function OrgDashboardShell({
  workspaceRoleMode,
  children,
  ...shellProps
}: OrgDashboardShellProps) {
  /*
    La barre du haut porte l'action principale de chaque espace, comme la
    maquette du 11 septembre : le commercial analyse un rendez-vous, le
    manager ouvre le playbook de son organisation. Le formulaire d'analyse
    charge ses options à l'ouverture, la barre n'a rien à savoir de l'org.
  */
  if (workspaceRoleMode === "admin") {
    return (
      <FeedbackCaptureProvider>
        <OrgManagerDashboardShell
          {...shellProps}
          primaryAction={
            shellProps.activeOrganizationId ? (
              <Link
                href="/company/settings/playbook"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden h-9 bg-brand text-brand-foreground hover:bg-brand-hover sm:inline-flex",
                )}
              >
                Playbook de l&apos;organisation
              </Link>
            ) : null
          }
        >
          {children}
        </OrgManagerDashboardShell>
      </FeedbackCaptureProvider>
    );
  }

  return (
    <FeedbackCaptureProvider>
      <OrgCommercialDashboardShell
        {...shellProps}
        primaryAction={
          shellProps.activeOrganizationId ? (
            <MeetingCreateDialog
              meetingTypeOptions={[]}
              pipelineStageOptions={[]}
              className="hidden h-9 sm:inline-flex"
              dataFeedbackId="topbar-analyser-rdv"
            />
          ) : null
        }
      >
        {children}
      </OrgCommercialDashboardShell>
    </FeedbackCaptureProvider>
  );
}
