"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutGrid,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  {
    href: "/dashboard/settings",
    label: "Aperçu",
    icon: LayoutGrid,
    match: "exact" as const,
  },
  {
    href: "/dashboard/settings/contexte",
    label: "Contexte",
    icon: Building2,
    match: "prefix" as const,
  },
  {
    href: "/dashboard/settings/coach-ia",
    label: "Coach IA",
    icon: Sparkles,
    match: "prefix" as const,
  },
  {
    href: "/dashboard/settings/process",
    label: "Process",
    icon: ClipboardList,
    match: "prefix" as const,
  },
  {
    href: "/dashboard/settings/equipe",
    label: "Équipe & accès",
    icon: Users,
    match: "prefix" as const,
  },
];

function subNavActive(pathname: string, href: string, match: "exact" | "prefix") {
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrgSettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="bg-card rounded-xl border p-3 lg:sticky lg:top-20">
          <p className="text-muted-foreground px-2 pb-2 text-xs font-medium tracking-wide uppercase">
            Paramètres org.
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Sections paramètres">
            {SETTINGS_NAV.map(({ href, label, icon: Icon, match }) => {
              const active = subNavActive(pathname, href, match);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-[#6C4DFF]/10 font-medium text-[#6C4DFF] dark:bg-[#6C4DFF]/15 dark:text-[#c4b5fd]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
