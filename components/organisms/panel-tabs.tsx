"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PanelTab<Id extends string> = {
  id: Id;
  label: string;
  panel: ReactNode;
};

/**
 * Des onglets dont les panneaux sont rendus côté serveur et passés tels
 * quels : l'onglet ne fait que montrer l'un et cacher les autres, si bien
 * qu'un changement d'onglet ne recharge rien.
 */
export function PanelTabs<Id extends string>({
  tabs,
  initial,
  label,
}: {
  tabs: PanelTab<Id>[];
  initial?: Id;
  /** Le nom de la rangée d'onglets, pour le lecteur d'écran. */
  label: string;
}) {
  const [active, setActive] = useState<Id | undefined>(
    initial && tabs.some((t) => t.id === initial) ? initial : tabs[0]?.id,
  );

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={label}
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
