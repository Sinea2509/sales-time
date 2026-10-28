"use client";

import { useState } from "react";
import { History, Search } from "lucide-react";
import { PrepareMeetingBriefingForm } from "@/components/organisms/prepare-meeting-briefing-form";
import { ProspectResearchForm } from "@/components/organisms/prospect-research-form";
import { cn } from "@/lib/utils";

const MODES = [
  {
    id: "web",
    label: "Nouveau prospect",
    hint: "Recherche web : entreprise, décideur, douleurs, questions",
    icon: Search,
  },
  {
    id: "historique",
    label: "Prospect déjà rencontré",
    hint: "À partir des rendez-vous déjà analysés avec ce contact",
    icon: History,
  },
] as const;

/**
 * Les deux façons de préparer un rendez-vous. Un premier rendez-vous n'a pas
 * d'historique : la préparation d'origine n'avait alors presque rien à dire,
 * d'où la recherche web (retour de Thomas du 28 octobre 2026).
 */
export function PrepareMeetingModes({
  pipelineStageOptions,
}: {
  pipelineStageOptions: string[];
}) {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("web");
  return (
    <div className="space-y-5">
      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Type de préparation"
      >
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                active
                  ? "border-brand bg-brand/8 ring-1 ring-brand/30"
                  : "border-border bg-card hover:border-brand/40 dark:border-zinc-800",
              )}
            >
              <m.icon
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  active ? "text-brand" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span>
                <span className="block text-sm font-semibold">{m.label}</span>
                <span className="text-muted-foreground block text-xs">
                  {m.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {mode === "web" ? (
        <ProspectResearchForm pipelineStageOptions={pipelineStageOptions} />
      ) : (
        <PrepareMeetingBriefingForm
          pipelineStageOptions={pipelineStageOptions}
        />
      )}
    </div>
  );
}
