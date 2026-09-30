"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MeetingDetailTabId =
  | "grille"
  | "objections"
  | "soncas"
  | "disc"
  | "kiss"
  | "email"
  | "transcript";

export type MeetingDetailTab = {
  id: MeetingDetailTabId;
  label: string;
  panel: ReactNode;
};

/**
 * Les sept onglets de la fiche. Les panneaux sont rendus côté serveur et
 * passés tels quels : l'onglet ne fait que montrer l'un et cacher les
 * autres, si bien qu'un changement d'onglet ne recharge rien.
 */
export function MeetingDetailTabs({
  tabs,
  initial = "grille",
}: {
  tabs: MeetingDetailTab[];
  initial?: MeetingDetailTabId;
}) {
  const [active, setActive] = useState<MeetingDetailTabId>(
    tabs.some((t) => t.id === initial) ? initial : (tabs[0]?.id ?? "grille"),
  );

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Détail de l'analyse"
        className="flex flex-wrap gap-0.5 border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`onglet-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panneau-${tab.id}`}
              onClick={() => setActive(tab.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                selected
                  ? "border-brand text-brand-hover dark:text-brand-muted"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panneau-${tab.id}`}
          aria-labelledby={`onglet-${tab.id}`}
          hidden={tab.id !== active}
          className="space-y-4"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
