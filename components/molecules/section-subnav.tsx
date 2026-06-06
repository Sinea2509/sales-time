"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type SectionSubnavItem = {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: ReactNode;
  active?: boolean;
  description?: string;
};

export type SectionSubnavSection = {
  label?: string;
  items: SectionSubnavItem[];
};

type SectionSubnavProps = {
  ariaLabel: string;
  sections: SectionSubnavSection[];
  footer?: ReactNode;
  activeTone?: "primary" | "brand";
  asideClassName?: string;
  sticky?: boolean;
};

function itemClassName(active: boolean, activeTone: "primary" | "brand") {
  if (!active) {
    return "text-foreground hover:bg-muted/80";
  }
  if (activeTone === "brand") {
    return "bg-brand/10 font-medium text-brand dark:bg-brand/15 dark:text-brand-muted";
  }
  return "bg-primary text-primary-foreground";
}

function SubnavItem({
  item,
  activeTone,
}: {
  item: SectionSubnavItem;
  activeTone: "primary" | "brand";
}) {
  const Icon = item.icon;
  const active = item.active ?? false;
  const className = cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
    itemClassName(active, activeTone),
  );

  const content = (
    <>
      {Icon ? <Icon className="size-4 shrink-0 opacity-80" aria-hidden /> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.label}</span>
        {item.description ? (
          <span className="block text-xs leading-snug opacity-80">
            {item.description}
          </span>
        ) : null}
      </span>
      {item.badge}
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onSelect}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </button>
  );
}

export function SectionSubnav({
  ariaLabel,
  sections,
  footer,
  activeTone = "primary",
  asideClassName,
  sticky = true,
}: SectionSubnavProps) {
  return (
    <aside className={cn("lg:w-72 lg:shrink-0", asideClassName)}>
      <nav
        aria-label={ariaLabel}
        className={cn(
          "border-border bg-card overflow-hidden rounded-xl border shadow-sm",
          sticky && "sticky top-4",
        )}
      >
        <div className="space-y-1 p-2">
          {sections.map((section) => (
            <div key={section.label ?? section.items[0]?.id} className="space-y-1">
              {section.label ? (
                <p className="text-muted-foreground px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide uppercase">
                  {section.label}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <SubnavItem item={item} activeTone={activeTone} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {footer ? <div className="border-border border-t p-3">{footer}</div> : null}
      </nav>
    </aside>
  );
}
