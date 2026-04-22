"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ElevatedModeIndicator } from "@/components/molecules/elevated-mode-indicator";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exitSuperAdminOrganizationAction } from "@/app/dashboard/super-admin-actions";

import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedClerkOrgId: string | null;
  /** When true, shows the shadcn sidebar menu trigger (must be inside SidebarProvider). */
  showSidebarTrigger?: boolean;
  /** When false, hides the centered org switcher (e.g. org switcher lives in the sidebar). */
  showOrganizationSwitcher?: boolean;
  /** When false, hides Account / Super admin text links (sidebar already lists them). */
  showHeaderNavLinks?: boolean;
};

export function DashboardHeader({
  showSuperAdminNav,
  isElevatedSuperAdmin,
  elevatedClerkOrgId,
  showSidebarTrigger = false,
  showOrganizationSwitcher = true,
  showHeaderNavLinks = true,
}: DashboardHeaderProps) {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:max-w-none">
        {showSidebarTrigger ? (
          <SidebarTrigger className="-ml-1 shrink-0" />
        ) : (
          <Link href="/dashboard" className="text-sm font-semibold">
            Sales Time
          </Link>
        )}
        {showOrganizationSwitcher ? (
          <div className="flex flex-1 items-center justify-center">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "flex justify-center",
                },
              }}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          {isElevatedSuperAdmin ? <ElevatedModeIndicator /> : null}
          {isElevatedSuperAdmin && elevatedClerkOrgId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void exitSuperAdminOrganizationAction({
                  clerkOrgId: elevatedClerkOrgId,
                  reason: "User exited super admin organization context",
                })
              }
            >
              Exit super admin org
            </Button>
          ) : null}
          {showHeaderNavLinks && showSuperAdminNav ? (
            <Link
              href="/dashboard/super-admin"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex items-center justify-center",
              )}
            >
              Super admin
            </Link>
          ) : null}
          {showHeaderNavLinks ? (
            <Link
              href="/dashboard/account"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "inline-flex items-center justify-center",
              )}
            >
              Account
            </Link>
          ) : null}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
