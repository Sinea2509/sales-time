"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileCode2,
  ShieldCheck,
  History,
  Activity,
  ArrowLeft,
  LogOut,
  Search,
} from "lucide-react";
import { AdminCommandPalette } from "@/components/organisms/admin-command-palette";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: "exact" | "prefix";
};

type AdminShellProps = {
  children: React.ReactNode;
  userEmail: string;
};

function navActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const platformNav: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: "exact",
  },
  {
    href: "/admin/organizations",
    label: "Organisations",
    icon: Building2,
    match: "prefix",
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: Users,
    match: "prefix",
  },
];

const configNav: NavItem[] = [
  {
    href: "/admin/prompts",
    label: "Prompts IA",
    icon: FileCode2,
    match: "prefix",
  },
  {
    href: "/admin/super-admins",
    label: "Super admins",
    icon: ShieldCheck,
    match: "prefix",
  },
  {
    href: "/admin/audit",
    label: "Journal d'audit",
    icon: History,
    match: "prefix",
  },
  {
    href: "/admin/health",
    label: "Santé système",
    icon: Activity,
    match: "prefix",
  },
];

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [commandOpen, setCommandOpen] = useState(false);
  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="none" side="left" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                Sales Time
              </span>
              <span className="text-[11px] leading-tight text-sidebar-foreground/60">
                Administration
              </span>
            </div>
          </div>
        </SidebarHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarContent className="max-h-full min-h-0 flex-none overflow-y-auto overscroll-contain">
            <SidebarGroup>
              <SidebarGroupLabel>Plateforme</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformNav.map((item) => {
                    const Icon = item.icon;
                    const active = navActive(pathname, item);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          render={<Link href={item.href} />}
                          tooltip={item.label}
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
              <SidebarGroupLabel>Configuration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {configNav.map((item) => {
                    const Icon = item.icon;
                    const active = navActive(pathname, item);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          render={<Link href={item.href} />}
                          tooltip={item.label}
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
          </SidebarContent>

          <SidebarFooter className="shrink-0 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/company" />}
                  tooltip={"Retour à l'app"}
                >
                  <ArrowLeft />
                  <span>{"Retour à l'app"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <form action="/sign-out" method="POST" className="w-full">
                  <SidebarMenuButton type="submit" tooltip="Déconnexion">
                    <LogOut />
                    <span>Déconnexion</span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2 px-2 pb-1">
              <Avatar className="size-6">
                <AvatarFallback className="bg-zinc-200 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {userEmail}
              </span>
            </div>
          </SidebarFooter>
        </div>
      </Sidebar>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--app-shell-surface)]">
        <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 z-50 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
          {isMobile ? <SidebarTrigger className="-ml-1 shrink-0" /> : null}
          <button
            onClick={() => setCommandOpen(true)}
            className={cn(
              "hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600 sm:inline-flex",
              "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:text-zinc-300",
            )}
          >
            <Search className="size-3.5" />
            <span>Rechercher...</span>
            <kbd className="pointer-events-none ml-2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
              ⌘K
            </kbd>
          </button>
          <div className="flex-1" />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
            )}
          >
            <ShieldCheck className="size-3" />
            Super Admin
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
