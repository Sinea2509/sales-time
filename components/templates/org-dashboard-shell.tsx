"use client";

import type { WorkspaceRoleMode } from "@/src/core/domain/authorization-policy";
import type { NotificationItem } from "@/components/organisms/notification-bell";
import type { OrgSwitcherMembership } from "@/components/organisms/org-switcher";
import type { SessionUserMenuInfo } from "@/components/organisms/dashboard-header";
import { FeedbackCaptureProvider } from "@/components/providers/feedback-capture-provider";
import { OrgCommercialDashboardShell } from "@/components/templates/org-commercial-dashboard-shell";
import { OrgManagerDashboardShell } from "@/components/templates/org-manager-dashboard-shell";

type OrgDashboardShellProps = {
  children: React.ReactNode;
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedOrganizationId: string | null;
  activeOrganizationId: string | null;
  workspaceRoleMode: WorkspaceRoleMode | null;
  trialAnalysesLeft: number;
  trialLimit: number;
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
  const sharedProps = { ...shellProps, children };

  if (workspaceRoleMode === "admin") {
    return (
      <FeedbackCaptureProvider>
        <OrgManagerDashboardShell {...sharedProps} />
      </FeedbackCaptureProvider>
    );
  }

  return (
    <FeedbackCaptureProvider>
      <OrgCommercialDashboardShell {...sharedProps} />
    </FeedbackCaptureProvider>
  );
}
