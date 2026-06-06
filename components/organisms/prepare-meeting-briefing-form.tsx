"use client";

import { useState, useTransition } from "react";
import { prepareBriefingAction } from "@/app/[locale]/company/preparer/actions";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { Sparkles } from "lucide-react";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";

export function PrepareMeetingBriefingForm({
  pipelineStageOptions,
}: {
  pipelineStageOptions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [targetStage, setTargetStage] = useState(pipelineStageOptions[0] ?? "");
  const [briefing, setBriefing] = useState<MeetingBriefingResult | null>(null);
  const [personName, setPersonName] = useState<string | null>(null);
  const [hasHistory, setHasHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          const personId = String(fd.get("personId") ?? "");
          if (!personId) {
            setError("Choisissez un contact.");
            return;
          }
          startTransition(async () => {
            const res = await prepareBriefingAction({
              personId,
              targetStage: String(fd.get("targetStage") ?? targetStage),
            });
            if (!res.ok) {
              setError("Impossible de générer le briefing.");
              return;
            }
            setBriefing(res.briefing);
            setPersonName(res.personName);
            setHasHistory(res.hasHistory);
          });
        }}
      >
        <ContactPicker />
        <div className="space-y-2">
          <Label htmlFor="targetStage">Étape cible du prochain RDV</Label>
          <select
            id="targetStage"
            name="targetStage"
            className={nativeSelectClassName}
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            required
          >
            {pipelineStageOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Génération…" : "Préparer le briefing"}
        </Button>
      </form>

      {!hasHistory && briefing ? (
        <PrdEmptyState
          icon={Sparkles}
          title="Premier RDV avec ce prospect"
          description="Pas d'historique — le briefing se base sur le profil et l'étape cible."
        />
      ) : null}

      {briefing ? (
        <div className="space-y-4 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">
            Briefing — {personName ?? "Prospect"}
          </h2>
          <p className="text-sm leading-relaxed">{briefing.lastMeetingSummary}</p>
          {(briefing.discDominant || briefing.soncasDominant) && (
            <p className="text-muted-foreground text-sm">
              Profils dominants — DISC {briefing.discDominant ?? "—"} · SONCAS{" "}
              {briefing.soncasDominant ?? "—"}
            </p>
          )}
          {briefing.customQuestions.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium">Questions à poser</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {briefing.customQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {briefing.startActions.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium">Actions Start</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {briefing.startActions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {briefing.openPoints.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium">Points ouverts</h3>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {briefing.openPoints.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <h3 className="text-sm font-medium">Conseils pour l&apos;étape</h3>
            <p className="text-muted-foreground text-sm">{briefing.stageAdvice}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
