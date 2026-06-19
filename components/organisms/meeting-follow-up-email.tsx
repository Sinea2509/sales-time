"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { generateFollowUpEmailAction } from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseFollowUpEmailDraft } from "@/src/core/domain/format-follow-up-email-draft";

function CopyFieldButton({
  value,
  label,
  disabled,
}: {
  value: string;
  label: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    if (!value.trim()) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      disabled={disabled || !value.trim()}
      aria-label={copied ? `${label} copié` : `Copier ${label}`}
      title={copied ? "Copié" : `Copier ${label}`}
      onClick={() => void copy()}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

export function MeetingFollowUpEmailBlock({
  meetingId,
  initialDraft,
}: {
  meetingId: string;
  initialDraft: string | null;
}) {
  const router = useRouter();
  const parsedInitial = parseFollowUpEmailDraft(initialDraft);
  const [subject, setSubject] = useState(parsedInitial.subject);
  const [body, setBody] = useState(parsedInitial.body);
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
              setSubject(r.subject);
              setBody(r.body);
              setMsg("Mail généré et enregistré.");
              router.refresh();
            });
          }}
        >
          Générer le mail de suivi
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="followup-subject">Objet</Label>
        <div className="flex gap-2">
          <Input
            id="followup-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'e-mail…"
            className="min-w-0 flex-1"
          />
          <CopyFieldButton value={subject} label="l'objet" disabled={pending} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="followup-body">Corps de l&apos;e-mail</Label>
        <div className="flex gap-2 items-start">
          <Textarea
            id="followup-body"
            rows={14}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Générez puis relisez avant envoi depuis votre messagerie…"
            className="min-w-0 flex-1"
          />
          <CopyFieldButton value={body} label="le corps" disabled={pending} />
        </div>
      </div>

      {msg ? (
        <p
          className={
            msg.startsWith("Mail généré")
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
