"use client";

import { useRef } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { ElevatedModeIndicator } from "@/components/molecules/elevated-mode-indicator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { exitSuperAdminOrganizationAction } from "@/app/[locale]/company/super-admin-actions";

import { SidebarTrigger } from "@/components/ui/sidebar";

export type SessionUserMenuInfo = {
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function userInitials(user: SessionUserMenuInfo): string {
  const f = user.firstName?.trim().charAt(0) ?? "";
  const l = user.lastName?.trim().charAt(0) ?? "";
  if (f && l) return `${f}${l}`.toUpperCase();
  if (f) return f.toUpperCase();
  const local = user.email.split("@")[0]?.slice(0, 2) ?? "?";
  return local.toUpperCase();
}

function userTriggerLabel(user: SessionUserMenuInfo): string {
  const n = user.firstName?.trim();
  if (n) return n;
  return user.email.split("@")[0] || user.email;
}

type DashboardHeaderProps = {
  showSuperAdminNav: boolean;
  isElevatedSuperAdmin: boolean;
  elevatedOrganizationId: string | null;
  /** When true, shows the shadcn sidebar menu trigger (must be inside SidebarProvider). */
  showSidebarTrigger?: boolean;
  /** When false, hides the centered org switcher (e.g. org switcher lives in the sidebar). */
  showOrganizationSwitcher?: boolean;
  /** When false, hides Account / Super admin text links (sidebar or user menu covers them). */
  showHeaderNavLinks?: boolean;
  /** When set, shows avatar + prénom menu (Settings, Déconnexion) instead of loose Account / Déconnexion. */
  sessionUser?: SessionUserMenuInfo | null;
  /**
   * When false, header stays in document flow (use with a dedicated scroll container below).
   * Default true keeps sticky top bar for full-page scroll layouts.
   */
  stickyTop?: boolean;
};

export function DashboardHeader({
  showSuperAdminNav,
  isElevatedSuperAdmin,
  elevatedOrganizationId,
  showSidebarTrigger = false,
  showOrganizationSwitcher = true,
  showHeaderNavLinks = true,
  sessionUser = null,
  stickyTop = true,
}: DashboardHeaderProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const signOutFormRef = useRef<HTMLFormElement>(null);

  return (
    <header
      className={cn(
        "border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 z-50 border-b backdrop-blur",
        stickyTop ? "sticky top-0" : "shrink-0",
      )}
    >
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-3 px-4 md:max-w-none">
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
          {sessionUser ? (
            <>
              <form
                ref={signOutFormRef}
                action="/sign-out"
                method="POST"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "flex max-w-[min(100%,14rem)] shrink-0 items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm outline-none",
                    "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
                  )}
                  aria-label={userTriggerLabel(sessionUser)}
                >
                  <Avatar size="sm">
                    <AvatarFallback className="bg-brand/15 text-xs font-semibold text-brand dark:bg-brand/20 dark:text-brand-muted">
                      {userInitials(sessionUser)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden truncate font-medium sm:inline">
                    {userTriggerLabel(sessionUser)}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-56">
                  <DropdownMenuLabel className="font-normal">
                    <span className="truncate text-sm font-medium text-foreground">
                      {userTriggerLabel(sessionUser)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                      {sessionUser.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/company/account")}
                    className="cursor-pointer"
                  >
                    <Settings className="size-4" />
                    {t("userSettings")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => signOutFormRef.current?.submit()}
                  >
                    <LogOut className="size-4" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
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
              <form action="/sign-out" method="POST" className="inline">
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "inline-flex items-center justify-center",
                  )}
                >
                  {t("signOut")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
