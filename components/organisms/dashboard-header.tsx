"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ElevatedModeIndicator } from "@/components/molecules/elevated-mode-indicator";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exitSuperAdminOrganizationAction } from "@/app/dashboard/super-admin-actions";

type DashboardHeaderProps = {
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedClerkOrgId: string | null;
};

export function DashboardHeader({
  showSuperAdminNav,
  isElevatedSuperAdmin,
  elevatedClerkOrgId,
}: DashboardHeaderProps) {
  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/dashboard" className="text-sm font-semibold">
          Sales Time
        </Link>
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
          {showSuperAdminNav ? (
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
          <Link
            href="/dashboard/account"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "inline-flex items-center justify-center",
            )}
          >
            Account
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
