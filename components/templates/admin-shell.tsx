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
  MessageSquare,
  CreditCard,
  Bot,
  BarChart3,
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

type NavSection = {
  label: string;
  items: NavItem[];
};

type AdminShellProps = {
  children: React.ReactNode;
  userEmail: string;
};

function navActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const adminNavSections: NavSection[] = [
  {
    label: "Plateforme",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: LayoutDashboard,
        match: "exact",
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: BarChart3,
        match: "prefix",
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
    ],
  },
  {
    label: "Opérations",
    items: [
      {
        href: "/admin/ai-logs",
        label: "Logs IA",
        icon: Bot,
        match: "prefix",
      },
      {
        href: "/admin/feedbacks",
        label: "Feedbacks",
        icon: MessageSquare,
        match: "prefix",
      },
      {
        href: "/admin/plan-requests",
        label: "Demandes upgrade",
        icon: CreditCard,
        match: "prefix",
      },
      {
        href: "/admin/health",
        label: "Santé système",
        icon: Activity,
        match: "prefix",
      },
      {
        href: "/admin/audit",
        label: "Journal d'audit",
        icon: History,
        match: "prefix",
      },
    ],
  },
  {
    label: "Configuration",
    items: [
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
    ],
  },
];

function AdminNavMenu({ pathname }: { pathname: string }) {
  return (
    <>
      {adminNavSections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
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
      ))}
    </>
  );
}

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [commandOpen, setCommandOpen] = useState(false);
  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="none" side="left" variant="sidebar">
        <SidebarHeader className="shrink-0 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="truncate text-sm font-semibold leading-tight">
                Sales Time
              </span>
              <span className="text-[11px] leading-tight text-sidebar-foreground/60">
                Administration
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AdminNavMenu pathname={pathname} />
        </SidebarContent>

        <SidebarFooter className="shrink-0 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/company" />}>
                <ArrowLeft />
                <span>Retour à l&apos;app</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <form action="/sign-out" method="POST" className="w-full">
                <SidebarMenuButton type="submit">
                  <LogOut />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="flex items-center gap-2 px-2 pb-1">
            <Avatar className="size-6 shrink-0">
              <AvatarFallback className="bg-zinc-200 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {userEmail}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--app-shell-surface)]">
        <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur">
          {isMobile ? <SidebarTrigger className="-ml-1 shrink-0" /> : null}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={cn(
              "hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600 sm:inline-flex",
              "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:text-zinc-300",
            )}
          >
            <Search className="size-3.5" />
            <span>Rechercher…</span>
            <kbd className="pointer-events-none ml-2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
              ⌘K
            </kbd>
          </button>
          <div className="flex-1" />
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
