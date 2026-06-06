"use client";

import { useState, useTransition } from "react";
import { submitPlanRequestAction } from "@/app/[locale]/company/plan-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

export function PlanUpgradeRequestForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
      <h2 className="text-base font-semibold">Demander un upgrade</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Quota d&apos;essai épuisé ou besoin de la vue manager ? Envoyez une
        demande à notre équipe.
      </p>
      {done ? (
        <p className="mt-4 text-sm text-emerald-700">
          Demande envoyée — nous vous recontactons rapidement.
        </p>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await submitPlanRequestAction({
                desiredPlan: String(fd.get("desiredPlan") ?? ""),
                message: String(fd.get("message") ?? ""),
              });
              if (!res.ok) {
                setError("Envoi impossible.");
                return;
              }
              setDone(true);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="desiredPlan">Forfait souhaité</Label>
            <select
              id="desiredPlan"
              name="desiredPlan"
              className={nativeSelectClassName}
              defaultValue="Team"
            >
              <option value="Starter">Starter</option>
              <option value="Team">Team</option>
              <option value="Entreprise">Entreprise</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optionnel)</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </form>
      )}
    </div>
  );
}
