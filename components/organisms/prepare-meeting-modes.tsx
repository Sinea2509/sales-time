"use client";

import { useState } from "react";
import { History, Search } from "lucide-react";
import { Icon3d } from "@/components/atoms/icon-3d";
import { PrepareMeetingBriefingForm } from "@/components/organisms/prepare-meeting-briefing-form";
import { ProspectResearchForm } from "@/components/organisms/prospect-research-form";
import { cn } from "@/lib/utils";

const MODES = [
  {
    id: "web",
    label: "Nouveau prospect",
    hint: "Recherche web : entreprise, décideur, douleurs, questions en or",
    icon: Search,
    tone: "violet",
  },
  {
    id: "historique",
    label: "Prospect déjà rencontré",
    hint: "Question en or, objections à anticiper, défis, à partir de vos rendez-vous",
    icon: History,
    tone: "coral",
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
                "flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-[translate,border-color,box-shadow] duration-200 hover:-translate-y-0.5",
                active
                  ? "border-brand bg-brand-soft/60 ring-1 ring-brand/30"
                  : "border-border bg-card hover:border-brand/40 dark:border-zinc-800",
              )}
            >
              <Icon3d tone={m.tone} size="md">
                <m.icon aria-hidden />
              </Icon3d>
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
