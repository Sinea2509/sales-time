"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Shield,
  UserCircle,
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
import { DashboardHeader } from "@/components/organisms/dashboard-header";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    match: "exact",
  },
];

const orgProductNav: NavItem[] = [
  {
    href: "/dashboard/rendez-vous",
    label: "Mes rendez-vous",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/analyse",
    label: "Analyse",
    icon: BarChart3,
  },
];

const footerNav: NavItem[] = [
  { href: "/dashboard/account", label: "Compte", icon: UserCircle },
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
}: OrgDashboardShellProps) {
  const pathname = usePathname();

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

          {!activeTenantClerkOrgId ? (
            <>
              <SidebarSeparator />
              <p className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden px-4 pb-2 text-xs leading-snug">
                Choisissez une organisation pour accéder à Mes rendez-vous et
                Analyse.
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
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#404040]/20">
                  <div
                    className="h-full rounded-full bg-[#6C4DFF]"
                    style={{ width: "100%" }}
                    aria-hidden
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#404040]">
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>
              <Link
                href="/dashboard/account"
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
