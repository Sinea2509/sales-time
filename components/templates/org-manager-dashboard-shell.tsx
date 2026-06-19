"use client";

import { useTranslations } from "next-intl";
import {
  ContactRound,
  LayoutDashboard,
  LineChart,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";
import {
  OrgDashboardShellFrame,
  type OrgDashboardNavGroup,
  type OrgDashboardShellFrameProps,
} from "@/components/templates/org-dashboard-shell-frame";

type Props = Omit<
  OrgDashboardShellFrameProps,
  | "workspaceBadgeLabel"
  | "workspaceBadgeClassName"
  | "navGroups"
  | "superAdminNavLabel"
  | "emptyOrganizationHint"
>;

export function OrgManagerDashboardShell(props: Props) {
  const tNav = useTranslations("nav");
  const tWorkspace = useTranslations("workspace");

  const navGroups: OrgDashboardNavGroup[] = [
    {
      label: tWorkspace("managerNavPilotage"),
      items: [
        {
          href: "/company",
          label: tNav("dashboard"),
          icon: LayoutDashboard,
          match: "exact",
        },
        {
          href: "/company/analyse",
          label: tNav("analyseTeam"),
          icon: LineChart,
        },
      ],
    },
    {
      label: tWorkspace("managerNavTeam"),
      items: [
        {
          href: "/company/equipe",
          label: tNav("myTeam"),
          icon: UsersRound,
          match: "prefix",
        },
        {
          href: "/company/rendez-vous",
          label: tNav("meetingsTeam"),
          icon: Users,
        },
        {
          href: "/company/contacts",
          label: tNav("contacts"),
          icon: ContactRound,
        },
      ],
    },
    {
      label: tWorkspace("managerNavAdmin"),
      items: [
        {
          href: "/company/settings",
          label: tNav("orgSettings"),
          icon: Settings,
          match: "prefix",
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col [--org-shell-accent:var(--brand)]">
      <OrgDashboardShellFrame
        {...props}
        workspaceBadgeLabel={tWorkspace("managerBadge")}
        workspaceBadgeClassName="border-brand/30 bg-brand/5 text-brand"
        navGroups={navGroups}
        superAdminNavLabel={tNav("superAdmin")}
        emptyOrganizationHint={tWorkspace("emptyOrganizationHint")}
      />
    </div>
  );
}
