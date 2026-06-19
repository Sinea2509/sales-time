"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, Mail, Sparkles, UsersRound, Workflow } from "lucide-react";
import { SectionSubnav } from "@/components/molecules/section-subnav";

const MANAGER_SETTINGS_NAV = [
  {
    id: "contexte",
    href: "/company/settings/contexte",
    label: "Contexte",
    icon: Building2,
    match: "prefix" as const,
  },
  {
    id: "coach-ia",
    href: "/company/settings/coach-ia",
    label: "Coach IA",
    icon: Sparkles,
    match: "prefix" as const,
  },
  {
    id: "process",
    href: "/company/settings/process",
    label: "Process",
    icon: Workflow,
    match: "prefix" as const,
  },
  {
    id: "email",
    href: "/company/settings/email",
    label: "E-mail de suivi",
    icon: Mail,
    match: "prefix" as const,
  },
  {
    id: "equipe",
    href: "/company/settings/equipe",
    label: "Équipe & accès",
    icon: UsersRound,
    match: "prefix" as const,
  },
] as const;

const COMMERCIAL_SETTINGS_NAV = [
  {
    id: "email",
    href: "/company/settings/email",
    label: "E-mail de suivi",
    icon: Mail,
    match: "prefix" as const,
  },
  {
    id: "equipe",
    href: "/company/settings/equipe",
    label: "Équipe & accès",
    icon: UsersRound,
    match: "prefix" as const,
  },
] as const;

function subNavActive(
  pathname: string,
  href: string,
  match: "exact" | "prefix",
) {
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrgSettingsShell({
  canManageOrganizationSettings,
  children,
}: {
  canManageOrganizationSettings: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const navItems = canManageOrganizationSettings
    ? MANAGER_SETTINGS_NAV
    : COMMERCIAL_SETTINGS_NAV;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <SectionSubnav
        ariaLabel="Sections paramètres"
        activeTone="brand"
        asideClassName="lg:w-56"
        sticky
        sections={[
          {
            label: tNav("orgSettings"),
            items: navItems.map(({ id, href, label, icon, match }) => ({
              id,
              href,
              label,
              icon,
              active: subNavActive(pathname, href, match),
            })),
          },
        ]}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
