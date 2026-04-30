"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOrganizationProcess } from "@/app/[locale]/company/settings/actions";
import { cn } from "@/lib/utils";
import { EditableStringList } from "@/components/molecules/editable-string-list";

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
  const [meetingTypes, setMeetingTypes] = useState(initial.meetingTypes);
  const [pipelineStages, setPipelineStages] = useState(initial.pipelineStages);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
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
    <form onSubmit={onSubmit} className="space-y-10">
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

      <EditableStringList
        id="org-meeting-types"
        title="Types de rendez-vous"
        description="Ex. Découverte, démo, négociation — utilisés dans les formulaires et rapports."
        items={meetingTypes}
        onChange={setMeetingTypes}
      />

      <EditableStringList
        id="org-pipeline-stages"
        title="Étapes du pipeline"
        description="Repères commerciaux alignés sur votre processus de vente."
        items={pipelineStages}
        onChange={setPipelineStages}
      />

      <Button
        type="submit"
        disabled={pending}
        className="bg-brand text-white hover:bg-brand-hover"
      >
        Enregistrer
      </Button>
    </form>
  );
}
