"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  generateFollowUpEmailAction,
  saveFollowUpEmailDraftAction,
} from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function MeetingFollowUpEmailBlock({
  meetingId,
  initialDraft,
}: {
  meetingId: string;
  initialDraft: string | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              const r = await generateFollowUpEmailAction(meetingId);
              if (!r.ok) {
                setMsg(r.message ?? r.error);
                return;
              }
              setDraft(r.draft);
              router.refresh();
            });
          }}
        >
          Générer le mail de suivi
        </Button>
        <Button
          type="button"
          className="bg-brand text-white hover:bg-brand-hover"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              const r = await saveFollowUpEmailDraftAction(meetingId, draft);
              if (!r.ok) {
                setMsg("Enregistrement impossible.");
                return;
              }
              setMsg("Brouillon enregistré.");
              router.refresh();
            });
          }}
        >
          Enregistrer le brouillon
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="followup-draft">Brouillon e-mail</Label>
        <Textarea
          id="followup-draft"
          rows={14}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Générez puis modifiez avant envoi depuis votre messagerie…"
        />
      </div>
      {msg ? (
        <p
          className={
            msg.startsWith("Brouillon")
              ? "text-sm text-green-700 dark:text-green-400"
              : "text-destructive text-sm"
          }
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
