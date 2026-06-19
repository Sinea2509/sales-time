"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOrganizationProcess } from "@/app/[locale]/company/settings/actions";
import { cn } from "@/lib/utils";
import {
  ProcessStringListSection,
  processItemsFromStrings,
  type ProcessStringListItem,
} from "@/components/molecules/process-string-list-section";

export type OrgProcessFormInitial = {
  meetingTypes: string[];
  pipelineStages: string[];
};

export function OrgSettingsProcessForm({
  initial,
  canEdit = true,
}: {
  initial: OrgProcessFormInitial;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [meetingTypeItems, setMeetingTypeItems] = useState<
    ProcessStringListItem[]
  >(() => processItemsFromStrings("mt", initial.meetingTypes));
  const [pipelineStageItems, setPipelineStageItems] = useState<
    ProcessStringListItem[]
  >(() => processItemsFromStrings("pl", initial.pipelineStages));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setMessage(null);
    startTransition(async () => {
      const r = await updateOrganizationProcess({
        meetingTypes: meetingTypeItems.map((x) => x.value).filter(Boolean),
        pipelineStages: pipelineStageItems.map((x) => x.value).filter(Boolean),
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
            message.type === "ok"
              ? "text-green-700 dark:text-green-400"
              : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <ProcessStringListSection
        label="Type de RDV"
        addButtonLabel="+ Ajouter un type"
        draftPlaceholder="Nouveau type de RDV"
        items={meetingTypeItems}
        setItems={setMeetingTypeItems}
        canEdit={canEdit}
      />

      <ProcessStringListSection
        label="Étapes du pipeline"
        addButtonLabel="+ Ajouter une étape"
        draftPlaceholder="Nouvelle étape"
        items={pipelineStageItems}
        setItems={setPipelineStageItems}
        canEdit={canEdit}
      />

      {canEdit ? (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={pending}
            className="bg-brand text-white hover:bg-brand-hover"
          >
            Enregistrer
          </Button>
        </div>
      ) : null}
    </form>
  );
}
