"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  KissCoachingPromptsForm,
  KissQuadrantKey,
} from "@/src/core/domain/kiss-org-coaching-prompts";

const KISS_QUADRANT_UI: Array<{ key: KissQuadrantKey; label: string }> = [
  { key: "keep", label: "Keep" },
  { key: "improve", label: "Improve" },
  { key: "start", label: "Start" },
  { key: "stop", label: "Stop" },
];

type Props = {
  value: KissCoachingPromptsForm;
  onChange: (next: KissCoachingPromptsForm) => void;
  /** Intro sous le titre (HTML évité : texte brut). */
  description?: ReactNode;
};

export function KissQuadrantPromptsFields({
  value,
  onChange,
  description,
}: Props) {
  return (
    <div className="space-y-4">
      {description ? (
        <div className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </div>
      ) : null}
      <div className="space-y-8">
        {KISS_QUADRANT_UI.map(({ key, label }) => (
          <fieldset key={key} className="space-y-3 rounded-lg border p-4">
            <legend className="text-foreground px-1 text-sm font-semibold">
              {label}
            </legend>
            <div className="space-y-2">
              <Label htmlFor={`kiss-${key}-global`}>Global</Label>
              <Textarea
                id={`kiss-${key}-global`}
                value={value[key].global}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [key]: {
                      ...value[key],
                      global: e.target.value.slice(0, 8000),
                    },
                  })
                }
                rows={3}
                placeholder="S’applique aux analyses RDV (priorité commercial) et aux synthèses manager."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`kiss-${key}-manager`}>Manager</Label>
              <Textarea
                id={`kiss-${key}-manager`}
                value={value[key].manager}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [key]: {
                      ...value[key],
                      manager: e.target.value.slice(0, 8000),
                    },
                  })
                }
                rows={3}
                placeholder="Synthèses tableau de bord équipe et fiche commercial."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`kiss-${key}-commercial`}>Commercial</Label>
              <Textarea
                id={`kiss-${key}-commercial`}
                value={value[key].commercial}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [key]: {
                      ...value[key],
                      commercial: e.target.value.slice(0, 8000),
                    },
                  })
                }
                rows={3}
                placeholder="Analyse KISS sur un rendez-vous (prioritaire sur le global pour le commercial)."
              />
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
