"use client";

import { useTranslations } from "next-intl";
import {
  Calendar,
  ContactRound,
  LayoutDashboard,
  LineChart,
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

export function OrgCommercialDashboardShell(props: Props) {
  const tNav = useTranslations("nav");
  const tWorkspace = useTranslations("workspace");

  const navGroups: OrgDashboardNavGroup[] = [
    {
      label: tWorkspace("commercialNavActivity"),
      items: [
        {
          href: "/company",
          label: tWorkspace("commercialDashboard"),
          icon: LayoutDashboard,
          match: "exact",
        },
        {
          href: "/company/rendez-vous",
          label: tNav("meetingsMine"),
          icon: Calendar,
        },
        {
          href: "/company/analyse",
          label: tNav("analyseMine"),
          icon: LineChart,
        },
        {
          href: "/company/contacts",
          label: tNav("contacts"),
          icon: ContactRound,
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col [--org-shell-accent:#059669]">
      <OrgDashboardShellFrame
        {...props}
        workspaceBadgeLabel={tWorkspace("commercialBadge")}
        workspaceBadgeClassName="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        navGroups={navGroups}
        superAdminNavLabel={tNav("superAdmin")}
        emptyOrganizationHint={tWorkspace("emptyOrganizationHint")}
      />
    </div>
  );
}
