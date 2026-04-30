"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "@/i18n/navigation";
import {
  Building2,
  FileText,
  LayoutDashboard,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchAdminAction } from "@/app/[locale]/admin/search-actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ResultItem = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  href: string;
  section: string;
};

const PAGES: ResultItem[] = [
  { id: "p-dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin", section: "Pages" },
  { id: "p-orgs", icon: Building2, label: "Organisations", href: "/admin/organizations", section: "Pages" },
  { id: "p-users", icon: Users, label: "Utilisateurs", href: "/admin/users", section: "Pages" },
  { id: "p-prompts", icon: FileText, label: "Prompts IA", href: "/admin/prompts", section: "Pages" },
  { id: "p-admins", icon: ShieldCheck, label: "Super admins", href: "/admin/super-admins", section: "Pages" },
  { id: "p-audit", icon: ScrollText, label: "Journal d'audit", href: "/admin/audit", section: "Pages" },
  { id: "p-health", icon: Activity, label: "Santé système", href: "/admin/health", section: "Pages" },
];

export function AdminCommandPalette({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<{
    users: { id: string; email: string; firstName: string | null; lastName: string | null }[];
    organizations: { id: string; name: string; slug: string }[];
  }>({ users: [], organizations: [] });
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setQuery("");
      setSearchResults({ users: [], organizations: [] });
      setActiveIndex(0);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const results = await searchAdminAction(trimmedQuery);
        setSearchResults(results);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [trimmedQuery, startTransition]);

  const allResults = useMemo(() => {
    const merged =
      trimmedQuery.length < 2
        ? { users: [], organizations: [] }
        : searchResults;
    const q = query.toLowerCase();
    const pages = PAGES.filter((p) => p.label.toLowerCase().includes(q));

    const orgs: ResultItem[] = merged.organizations.map((o) => ({
      id: `org-${o.id}`,
      icon: Building2,
      label: o.name,
      subtitle: o.slug,
      href: `/admin/organizations`,
      section: "Organisations",
    }));

    const users: ResultItem[] = merged.users.map((u) => ({
      id: `user-${u.id}`,
      icon: Users,
      label: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email,
      subtitle: u.email,
      href: `/admin/users`,
      section: "Utilisateurs",
    }));

    return [...pages, ...orgs, ...users];
  }, [query, trimmedQuery, searchResults]);

  const resultsFingerprint = useMemo(
    () => allResults.map((r) => r.id).join("|"),
    [allResults],
  );
  const [prevFingerprint, setPrevFingerprint] = useState(resultsFingerprint);
  if (resultsFingerprint !== prevFingerprint) {
    setPrevFingerprint(resultsFingerprint);
    setActiveIndex(0);
  }

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    const maxIdx = Math.max(0, allResults.length - 1);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, maxIdx));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[activeIndex]) {
      e.preventDefault();
      navigate(allResults[activeIndex].href);
    }
  }

  useEffect(() => {
    const active = listRef.current?.querySelector("[data-active=true]");
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const sections = useMemo(() => {
    const map = new Map<string, ResultItem[]>();
    for (const item of allResults) {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return Array.from(map.entries());
  }, [allResults]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche admin</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3">
          <Search className="size-4 shrink-0 text-zinc-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher des pages, organisations, utilisateurs..."
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {allResults.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-zinc-400">
              {query.trim() ? "Aucun résultat." : "Tapez pour rechercher..."}
            </p>
          ) : (
            sections.map(([section, items]) => (
              <div key={section} className="mb-1">
                <p className="px-3 py-1.5 text-xs font-medium text-zinc-400">
                  {section}
                </p>
                {items.map((item) => {
                  const idx = allResults.indexOf(item);
                  const Icon = item.icon;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50",
                      )}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.subtitle && (
                        <span className="truncate text-xs text-zinc-400">
                          {item.subtitle}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
