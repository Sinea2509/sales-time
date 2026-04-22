"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Shield,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible?: boolean;
  /** Default: prefix match on pathname */
  match?: "exact" | "prefix";
};

type AdminSidebarProps = {
  showSuperAdminNav: boolean;
  activeTenantClerkOrgId: string | null;
};

export function AdminSidebar({
  showSuperAdminNav,
  activeTenantClerkOrgId,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const items: SidebarItem[] = [
    {
      href: "/dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      match: "exact",
    },
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
    {
      href: "/dashboard/account",
      label: "Compte",
      icon: UserCircle,
    },
    {
      href: "/dashboard/super-admin",
      label: "Super admin",
      icon: Shield,
      visible: showSuperAdminNav,
    },
  ];

  return (
    <aside className="bg-[var(--app-shell-sidebar-bg)] text-[var(--app-shell-sidebar-text)] hidden w-[280px] shrink-0 border-r border-[var(--app-shell-sidebar-border)] lg:flex lg:flex-col">
      <div className="border-b border-[var(--app-shell-sidebar-border)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--app-shell-sidebar-accent)] flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white">
            ST
          </div>
          <div>
            <p className="text-sm font-semibold">Sales Time</p>
            <p className="text-[11px] text-[var(--app-shell-sidebar-muted)]">
              Organization Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items
          .filter((item) => item.visible ?? true)
          .map((item) => {
            const isActive =
              item.match === "exact"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--app-shell-sidebar-active-bg)] text-[var(--app-shell-sidebar-active-text)]"
                    : "text-[var(--app-shell-sidebar-muted)] hover:bg-[var(--app-shell-sidebar-hover-bg)] hover:text-[var(--app-shell-sidebar-text)]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="m-3 rounded-xl border border-[var(--app-shell-sidebar-border)] bg-[var(--app-shell-sidebar-card-bg)] p-3">
        <p className="text-[11px] uppercase tracking-wide text-[var(--app-shell-sidebar-muted)]">
          Active Organization
        </p>
        <p className="mt-1 truncate text-xs font-medium">
          {activeTenantClerkOrgId ?? "No active org selected"}
        </p>
      </div>
    </aside>
  );
}
