"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ElevatedModeIndicator } from "@/components/molecules/elevated-mode-indicator";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exitSuperAdminOrganizationAction } from "@/app/[locale]/company/super-admin-actions";

import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedOrganizationId: string | null;
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
  elevatedOrganizationId,
  showSidebarTrigger = false,
  showOrganizationSwitcher = true,
  showHeaderNavLinks = true,
}: DashboardHeaderProps) {
  const t = useTranslations("common");

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 md:max-w-none">
        {showSidebarTrigger ? (
          <SidebarTrigger className="-ml-1 shrink-0" />
        ) : (
          <Link href="/company" className="text-sm font-semibold">
            {t("appName")}
          </Link>
        )}
        {showOrganizationSwitcher ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {/* Org switcher lives in the sidebar in the default shell. */}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          {isElevatedSuperAdmin ? <ElevatedModeIndicator /> : null}
          {isElevatedSuperAdmin && elevatedOrganizationId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void exitSuperAdminOrganizationAction({
                  organizationId: elevatedOrganizationId,
                  reason: "User exited super admin organization context",
                })
              }
            >
              {t("exitSuperAdminOrg")}
            </Button>
          ) : null}
          {showHeaderNavLinks && showSuperAdminNav ? (
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex items-center justify-center",
              )}
            >
              {t("superAdmin")}
            </Link>
          ) : null}
          {showHeaderNavLinks ? (
            <Link
              href="/company/account"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "inline-flex items-center justify-center",
              )}
            >
              {t("account")}
            </Link>
          ) : null}
          <Link
            href="/sign-out"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex items-center justify-center",
            )}
          >
            Déconnexion
          </Link>
        </div>
      </div>
    </header>
  );
}
