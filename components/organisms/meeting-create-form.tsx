"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeetingAction } from "@/app/company/rendez-vous/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const outcomes = [
  { value: "WON", label: "Gagné" },
  { value: "LOST", label: "Perdu" },
  { value: "FOLLOW_UP", label: "Suivi" },
  { value: "NO_SHOW", label: "Absent" },
  { value: "OTHER", label: "Autre" },
] as const;

export function MeetingCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await createMeetingAction(fd);
          if (!res.ok) {
            setError(
              res.error === "VALIDATION"
                ? "Vérifiez les champs obligatoires."
                : res.error,
            );
            return;
          }
          router.push(`/company/rendez-vous/${res.meetingId}`);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prospectName">Prospect</Label>
          <Input id="prospectName" name="prospectName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meetingAt">Date du rendez-vous</Label>
          <Input
            id="meetingAt"
            name="meetingAt"
            type="datetime-local"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMin">Durée (minutes)</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min={0}
            placeholder="Optionnel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outcome">Résultat</Label>
          <select
            id="outcome"
            name="outcome"
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            defaultValue="FOLLOW_UP"
            required
          >
            {outcomes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="transcript">Transcript / compte-rendu</Label>
        <Textarea
          id="transcript"
          name="transcript"
          required
          rows={8}
          placeholder="Collez ou saisissez le transcript de l’échange…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le rendez-vous"}
      </Button>
    </form>
  );
}
