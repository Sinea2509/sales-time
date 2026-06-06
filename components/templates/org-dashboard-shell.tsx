"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from "next-intl";
import {
  Calendar,
  ContactRound,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldUser,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import {
  DashboardHeader,
  type SessionUserMenuInfo,
} from "@/components/organisms/dashboard-header";
import type { NotificationItem } from "@/components/organisms/notification-bell";
import {
  OrgSwitcher,
  type OrgSwitcherMembership,
} from "@/components/organisms/org-switcher";
import { cn } from "@/lib/utils";
import type { WorkspaceRoleMode } from "@/src/core/domain/authorization-policy";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

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

function navActive(pathname: string, item: NavItem) {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function OrgDashboardShell({
  children,
  showSuperAdminNav,
  isElevatedSuperAdmin,
  elevatedOrganizationId,
  activeOrganizationId,
  workspaceRoleMode,
  trialAnalysesLeft,
  trialLimit,
  unreadNotificationCount,
  notifications,
  organizationSwitcherMemberships,
  sessionUser,
}: OrgDashboardShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const tNav = useTranslations("nav");
  const isAdmin = workspaceRoleMode === "admin";
  const mainNav: NavItem[] = [
    {
      href: "/company",
      label: tNav("dashboard"),
      icon: LayoutDashboard,
      match: "exact",
    },
  ];
  const orgProductNav: NavItem[] = [
    {
      href: "/company/rendez-vous",
      label: isAdmin ? tNav("meetingsTeam") : tNav("meetingsMine"),
      icon: Calendar,
    },
    {
      href: "/company/analyse",
      label: isAdmin ? tNav("analyseTeam") : tNav("analyseMine"),
      icon: LineChart,
    },
    {
      href: "/company/contacts",
      label: tNav("contacts"),
      icon: ContactRound,
    },
  ];
  const orgAdminNav: NavItem[] =
    workspaceRoleMode === "admin"
      ? [
          {
            href: "/company/settings",
            label: tNav("orgSettings"),
            icon: Settings,
            match: "prefix",
          },
        ]
      : [];
  const footerNav: NavItem[] = showSuperAdminNav
    ? [
        {
          href: "/admin",
          label: tNav("superAdmin"),
          icon: ShieldUser,
        },
      ]
    : [];
  const [showQuotaPopup, setShowQuotaPopup] = useState(false);
  const analysesUsed = Math.max(0, trialLimit - trialAnalysesLeft);
  const quotaReached = trialAnalysesLeft <= 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, (analysesUsed / trialLimit) * 100),
  );

  // SessionStorage is unavailable during SSR; open the quota modal once per tab after mount.
  /* eslint-disable react-hooks/set-state-in-effect -- intentional client-only sync with sessionStorage */
  useEffect(() => {
    if (!quotaReached) {
      setShowQuotaPopup(false);
      return;
    }
    const alreadySeen = sessionStorage.getItem("quota-popup-seen") === "1";
    if (!alreadySeen) {
      setShowQuotaPopup(true);
      sessionStorage.setItem("quota-popup-seen", "1");
    }
  }, [quotaReached]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="none" side="left" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="px-2 py-1.5">
            <OrgSwitcher
              memberships={organizationSwitcherMemberships}
              currentOrganizationId={activeOrganizationId}
            />
          </div>
        </SidebarHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[...mainNav, ...orgProductNav, ...orgAdminNav].map(
                    (item) => {
                      const Icon = item.icon;
                      const active = navActive(pathname, item);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            isActive={active}
                            render={<Link href={item.href} />}
                          >
                            <Icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    },
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {!activeOrganizationId ? (
              <>
                <SidebarSeparator />
                <p className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden px-4 pb-2 text-xs leading-snug">
                  Choisissez une organisation pour accéder aux rendez-vous et à
                  l’analyse.
                </p>
              </>
            ) : null}
          </SidebarContent>

          <SidebarFooter className="shrink-0">
            {footerNav.length > 0 ? (
              <SidebarMenu>
                {footerNav.map((item) => {
                  const Icon = item.icon;
                  const active = navActive(pathname, item);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        render={<Link href={item.href} />}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            ) : null}

            <div
              className={cn(
                "group-data-[collapsible=icon]:hidden px-2 pb-3",
                footerNav.length > 0 ? "pt-1" : "pt-2",
              )}
            >
              <div className="rounded-xl border border-[#404040]/20 bg-[#F5F5F5] p-3">
                <p className="text-sm font-semibold text-[#171717]">
                  Essai gratuit
                </p>
                <p className="mt-1 text-xs leading-snug text-[#404040]">
                  {trialAnalysesLeft > 0
                    ? `Plus que ${trialAnalysesLeft} analyse${trialAnalysesLeft > 1 ? "s" : ""} — passez au plan pour continuer`
                    : "Quota épuisé — passez au plan pour continuer"}
                </p>
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#171717]/20">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${progressPercent}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
                <Link
                  href="/company/plan"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-3 h-8 w-full rounded-md bg-brand px-3 text-xs text-white hover:bg-brand-hover",
                  )}
                >
                  Voir tous les plans
                </Link>
              </div>
            </div>
          </SidebarFooter>
        </div>
      </Sidebar>

      {showQuotaPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#171717] dark:text-neutral-100">
                  Quota d&apos;analyses atteint
                </h3>
                <p className="mt-1 text-sm text-[#404040] dark:text-neutral-300">
                  Vos {trialLimit} analyses gratuites sont utilisées. Demandez un
                  upgrade pour débloquer la suite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuotaPopup(false)}
                className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 rounded-md",
                )}
                onClick={() => setShowQuotaPopup(false)}
              >
                Fermer
              </button>
              <Link
                href="/company/plan"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-8 rounded-md bg-brand text-white hover:bg-brand-hover",
                )}
                onClick={() => setShowQuotaPopup(false)}
              >
                Book a meeting with Cedric
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--app-shell-surface)]">
        <DashboardHeader
          showSuperAdminNav={showSuperAdminNav}
          isElevatedSuperAdmin={isElevatedSuperAdmin}
          elevatedOrganizationId={elevatedOrganizationId}
          showSidebarTrigger={isMobile}
          showOrganizationSwitcher={false}
          showHeaderNavLinks={false}
          sessionUser={sessionUser}
          stickyTop={false}
          unreadNotificationCount={unreadNotificationCount}
          notifications={notifications}
          showFeedbackWidget
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
