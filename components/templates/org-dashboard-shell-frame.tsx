"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShieldUser, X } from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { buttonVariants } from "@/components/ui/button";
import { prospectInitials } from "@/lib/prospect-initials";
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

export type OrgDashboardNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

export type OrgDashboardNavGroup = {
  label?: string;
  items: OrgDashboardNavItem[];
};

export type OrgDashboardShellFrameProps = {
  children: React.ReactNode;
  workspaceBadgeLabel: string;
  workspaceBadgeClassName: string;
  navGroups: OrgDashboardNavGroup[];
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedOrganizationId: string | null;
  activeOrganizationId: string | null;
  trialAnalysesLeft: number;
  trialLimit: number;
  planUnlocked: boolean;
  unreadNotificationCount: number;
  notifications: NotificationItem[];
  organizationSwitcherMemberships: OrgSwitcherMembership[];
  sessionUser: SessionUserMenuInfo;
  superAdminNavLabel: string;
  emptyOrganizationHint: string;
  /** L'action principale de l'espace, posée dans la barre du haut. */
  primaryAction?: React.ReactNode;
};

function navActive(pathname: string, item: OrgDashboardNavItem) {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function OrgDashboardShellFrame({
  children,
  workspaceBadgeLabel,
  navGroups,
  showSuperAdminNav,
  isElevatedSuperAdmin,
  elevatedOrganizationId,
  activeOrganizationId,
  trialAnalysesLeft,
  trialLimit,
  planUnlocked,
  unreadNotificationCount,
  notifications,
  organizationSwitcherMemberships,
  sessionUser,
  superAdminNavLabel,
  emptyOrganizationHint,
  primaryAction = null,
}: OrgDashboardShellFrameProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const footerNav: OrgDashboardNavItem[] = showSuperAdminNav
    ? [
        {
          href: "/admin",
          label: superAdminNavLabel,
          icon: ShieldUser,
        },
      ]
    : [];
  const [showQuotaPopup, setShowQuotaPopup] = useState(false);
  const showTrialQuota = !planUnlocked;
  const activeOrganizationName =
    organizationSwitcherMemberships.find(
      (m) => m.organizationId === activeOrganizationId,
    )?.name ?? null;
  const userName =
    [sessionUser.firstName, sessionUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || sessionUser.email;
  const analysesUsed = Math.max(0, trialLimit - trialAnalysesLeft);
  const quotaReached = showTrialQuota && trialAnalysesLeft <= 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, (analysesUsed / trialLimit) * 100),
  );

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
        <SidebarHeader className="gap-3 px-3 pt-4 pb-2">
          {/*
            La marque en tête, comme dans la maquette : la pastille dégradée
            et le nom. L'organisation et le rôle descendent en bas de la
            colonne, avec la personne connectée.
          */}
          <Link
            href="/company"
            className="flex items-center gap-2.5 px-1 text-[15.5px] font-extrabold tracking-[-0.015em]"
          >
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-[#8468ff] to-[#5a3fd9] text-[12px] font-extrabold text-white shadow-[0_2px_6px_rgba(108,77,255,0.32)]"
            >
              ST
            </span>
            <span>Sales Time</span>
          </Link>
          <OrgSwitcher
            memberships={organizationSwitcherMemberships}
            currentOrganizationId={activeOrganizationId}
          />
        </SidebarHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {navGroups.map((group, index) => (
              <SidebarGroup key={group.label ?? `nav-group-${index}`}>
                {group.label ? (
                  <SidebarGroupLabel className="h-auto px-2.5 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.09em] text-muted-foreground uppercase">
                    {group.label}
                  </SidebarGroupLabel>
                ) : null}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = navActive(pathname, item);
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            isActive={active}
                            render={<Link href={item.href} />}
                            className="min-h-[35px] rounded-[9px] px-2.5 py-2 text-[13.2px] font-medium text-muted-foreground hover:text-foreground data-active:font-semibold"
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
            ))}

            {!activeOrganizationId ? (
              <>
                <SidebarSeparator />
                <p className="text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden px-4 pb-2 text-xs leading-snug">
                  {emptyOrganizationHint}
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
                        className="min-h-[35px] rounded-[9px] px-2.5 py-2 text-[13.2px] font-medium text-muted-foreground hover:text-foreground data-active:font-semibold"
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            ) : null}

            {showTrialQuota ? (
              <div
                className={cn(
                  "group-data-[collapsible=icon]:hidden px-2 pb-3",
                  footerNav.length > 0 ? "pt-1" : "pt-2",
                )}
              >
                <div className="rounded-[13px] border-border border bg-muted/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold text-foreground">
                      Essai gratuit
                    </p>
                    <p className="text-muted-foreground text-[11.5px] tabular-nums">
                      {analysesUsed} / {trialLimit}
                    </p>
                  </div>
                  <div className="mt-2.5 h-[5px] w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8468ff] to-[#6c4dff]"
                      style={{ width: `${progressPercent}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-muted-foreground text-[11.5px] leading-snug">
                    {trialAnalysesLeft > 0
                      ? `Plus que ${trialAnalysesLeft} analyse${trialAnalysesLeft > 1 ? "s" : ""} offerte${trialAnalysesLeft > 1 ? "s" : ""}.`
                      : "Quota épuisé, passez au plan pour continuer."}
                  </p>
                  <Link
                    href="/company/plan"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "mt-2.5 h-8 w-full rounded-md bg-brand px-3 text-xs text-brand-foreground hover:bg-brand-hover",
                    )}
                  >
                    Voir les plans
                  </Link>
                </div>
              </div>
            ) : null}

            {/*
              Qui est connecté, et à quel titre : la personne, son rôle et
              son organisation, en bas de la colonne, comme dans la maquette.
            */}
            <div className="border-sidebar-border flex items-center gap-2.5 border-t px-2 pt-3 pb-1 group-data-[collapsible=icon]:hidden">
              <span className="bg-brand-soft text-brand-hover grid size-[31px] shrink-0 place-items-center rounded-full text-[11px] font-extrabold dark:text-brand-muted">
                {prospectInitials(userName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold text-foreground">
                  {userName}
                </p>
                <p className="text-muted-foreground truncate text-[11.5px]">
                  {workspaceBadgeLabel}
                  {activeOrganizationName ? `, ${activeOrganizationName}` : ""}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </div>
      </Sidebar>

      {showQuotaPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground dark:text-neutral-100">
                  Quota d&apos;analyses atteint
                </h3>
                <p className="mt-1 text-muted-foreground text-sm dark:text-neutral-300">
                  Vos {trialLimit} analyses gratuites sont utilisées. Demandez
                  le passage au plan supérieur pour débloquer la suite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuotaPopup(false)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-neutral-100"
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
                  "h-8 rounded-md bg-brand text-brand-foreground hover:bg-brand-hover",
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
          primaryAction={primaryAction}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
