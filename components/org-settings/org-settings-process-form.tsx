"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationProcess } from "@/app/dashboard/settings/actions";
import { cn } from "@/lib/utils";

function linesToTypes(s: string, max: number, maxLen: number): string[] {
  const out: string[] = [];
  for (const line of s.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    out.push(t.slice(0, maxLen));
    if (out.length >= max) break;
  }
  return out;
}

export type OrgProcessFormInitial = {
  meetingTypes: string[];
  pipelineStages: string[];
};

export function OrgSettingsProcessForm({
  initial,
}: {
  initial: OrgProcessFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [meetingText, setMeetingText] = useState(initial.meetingTypes.join("\n"));
  const [pipelineText, setPipelineText] = useState(
    initial.pipelineStages.join("\n"),
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const meetingTypes = linesToTypes(meetingText, 40, 120);
      const pipelineStages = linesToTypes(pipelineText, 40, 120);
      const r = await updateOrganizationProcess({
        meetingTypes,
        pipelineStages,
      });
      if (!r.ok) {
        setMessage({ type: "err", text: r.message });
        return;
      }
      setMessage({ type: "ok", text: "Enregistré." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <p
          className={cn(
            "text-sm",
            message.type === "ok" ? "text-green-700 dark:text-green-400" : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="org-mt">Types de rendez-vous (un par ligne)</Label>
        <Textarea
          id="org-mt"
          value={meetingText}
          onChange={(e) => setMeetingText(e.target.value)}
          rows={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-pl">Étapes du pipeline (une par ligne)</Label>
        <Textarea
          id="org-pl"
          value={pipelineText}
          onChange={(e) => setPipelineText(e.target.value)}
          rows={8}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-[#6C4DFF] text-white hover:bg-[#5a3fd9]"
      >
        Enregistrer
      </Button>
    </form>
  );
}
