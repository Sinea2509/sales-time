"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Settings2,
  X,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { DashboardHeader } from "@/components/organisms/dashboard-header";
import { cn } from "@/lib/utils";
import type { DashboardRoleMode } from "@/src/core/domain/authorization-policy";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

function mainNavItems(): NavItem[] {
  return [
    {
      href: "/dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      match: "exact",
    },
  ];
}

function orgProductNavItems(role: DashboardRoleMode | null): NavItem[] {
  const isAdmin = role === "admin";
  return [
    {
      href: "/dashboard/rendez-vous",
      label: isAdmin ? "Rendez-vous (équipe)" : "Mes rendez-vous",
      icon: CalendarDays,
    },
    {
      href: "/dashboard/analyse",
      label: isAdmin ? "Analyse (équipe)" : "Mon analyse",
      icon: BarChart3,
    },
  ];
}

function orgAdminNavItems(role: DashboardRoleMode | null): NavItem[] {
  if (role !== "admin") return [];
  return [
    {
      href: "/dashboard/settings",
      label: "Paramètres org.",
      icon: Settings2,
      match: "prefix",
    },
  ];
}

const footerNav: NavItem[] = [
  {
    href: "/dashboard/super-admin",
    label: "Super admin",
    icon: Shield,
  },
];

type OrgDashboardShellProps = {
  children: React.ReactNode;
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedClerkOrgId: string | null;
  activeTenantClerkOrgId: string | null;
  dashboardRoleMode: DashboardRoleMode | null;
  analysesUsed: number;
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
  elevatedClerkOrgId,
  activeTenantClerkOrgId,
  dashboardRoleMode,
  analysesUsed,
}: OrgDashboardShellProps) {
  const pathname = usePathname();
  const mainNav = mainNavItems();
  const orgProductNav = orgProductNavItems(dashboardRoleMode);
  const orgAdminNav = orgAdminNavItems(dashboardRoleMode);
  const [showQuotaPopup, setShowQuotaPopup] = useState(false);
  const freeAnalysesLimit = 5;
  const quotaReached = analysesUsed >= freeAnalysesLimit;
  const progressPercent = Math.min(
    100,
    Math.max(0, (analysesUsed / freeAnalysesLimit) * 100),
  );

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

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="group-data-[collapsible=icon]:hidden px-2 py-1.5">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full max-w-full",
                  organizationSwitcherTrigger:
                    "w-full max-w-full justify-between border border-sidebar-border bg-sidebar-accent/30 px-2 py-1.5 text-sidebar-foreground shadow-none hover:bg-sidebar-accent",
                },
              }}
            />
          </div>
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-1.5">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  organizationSwitcherTrigger:
                    "flex size-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-0 hover:bg-sidebar-accent",
                },
              }}
            />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => {
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
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Espace commercial</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {orgProductNav.map((item) => {
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
            </SidebarGroupContent>
          </SidebarGroup>

          {orgAdminNav.length > 0 ? (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Organisation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {orgAdminNav.map((item) => {
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
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          ) : null}

          {!activeTenantClerkOrgId ? (
            <>
              <SidebarSeparator />
              <p className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden px-4 pb-2 text-xs leading-snug">
                Choisissez une organisation pour accéder aux rendez-vous et à
                l’analyse.
              </p>
            </>
          ) : null}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="group-data-[collapsible=icon]:hidden px-2 pb-3">
            <div className="rounded-xl border border-[#404040]/20 bg-[#F5F5F5] p-3">
              <p className="text-sm font-semibold text-[#171717]">
                Essai gratuit
              </p>
              <p className="mt-1 text-xs leading-snug text-[#404040]">
                Plus que 5 analyses — passez au plan pour continuer
              </p>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#171717]/20">
                  <div
                    className="h-full rounded-full bg-[#6C4DFF]"
                    style={{ width: `${progressPercent}%` }}
                    aria-hidden
                  />
                </div>
              </div>
              <Link
                href="/plan"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "mt-3 h-8 w-full rounded-md bg-[#6C4DFF] px-3 text-xs text-white hover:bg-[#5a3fd9]",
                )}
              >
                Voir tout les plans
              </Link>
            </div>
          </div>

          <SidebarMenu>
            {footerNav
              .filter(
                (item) =>
                  item.href !== "/dashboard/super-admin" || showSuperAdminNav,
              )
              .map((item) => {
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
          {activeTenantClerkOrgId ? (
            <p className="text-sidebar-foreground/60 truncate px-2 pb-1 font-mono text-[10px]">
              {activeTenantClerkOrgId}
            </p>
          ) : null}
        </SidebarFooter>
        <SidebarRail />
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
                  Vos 5 analyses gratuites sont utilisees. Book a meeting with
                  Cedric pour debloquer la suite.
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
                href="/plan"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-8 rounded-md bg-[#6C4DFF] text-white hover:bg-[#5a3fd9]",
                )}
                onClick={() => setShowQuotaPopup(false)}
              >
                Book a meeting with Cedric
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <SidebarInset className="bg-[var(--app-shell-surface)] min-h-svh">
        <DashboardHeader
          showSuperAdminNav={showSuperAdminNav}
          isElevatedSuperAdmin={isElevatedSuperAdmin}
          elevatedClerkOrgId={elevatedClerkOrgId}
          showSidebarTrigger
          showOrganizationSwitcher={false}
          showHeaderNavLinks={false}
        />
        <div className="flex-1 p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
