"use client";

import { Check, Copy, Sparkles, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  generateFollowUpEmailAction,
  reviseFollowUpEmailAction,
} from "@/app/[locale]/company/rendez-vous/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FOLLOW_UP_EMAIL_QUICK_REVISIONS } from "@/src/core/domain/follow-up-email-zod";
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
  const [instruction, setInstruction] = useState("");
  const [previous, setPrevious] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  /*
    La retouche d'un mail sans passer par ChatGPT (retour de Thomas du 28
    octobre 2026) : un clic sur une retouche courante, ou une demande libre.
    La version précédente reste à portée d'un clic.
  */
  function revise(demande: string) {
    if (!body.trim() || !demande.trim()) return;
    setMsg(null);
    const before = { subject, body };
    startTransition(async () => {
      const r = await reviseFollowUpEmailAction({
        meetingId,
        subject,
        body,
        instruction: demande,
      });
      if (!r.ok) {
        setMsg(
          r.error === "FAILED"
            ? "La retouche n'a pas pu être faite. Réessayez dans un instant."
            : "Retouche impossible sur ce rendez-vous.",
        );
        return;
      }
      setPrevious(before);
      setSubject(r.subject);
      setBody(r.body);
      setInstruction("");
      setMsg("Mail retouché et enregistré.");
      router.refresh();
    });
  }

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

      {body.trim() ? (
        <div className="space-y-2.5 rounded-xl border border-brand/25 bg-brand/5 p-3.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="text-brand size-4" aria-hidden />
            Modifier avec le coach
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FOLLOW_UP_EMAIL_QUICK_REVISIONS.map((r) => (
              <Button
                key={r.id}
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => revise(r.instruction)}
              >
                {r.label}
              </Button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              revise(instruction);
            }}
          >
            <Input
              aria-label="Demande de modification"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ou dites ce que vous voulez changer : « ajoute que la DRH sera présente », « tutoie-le »…"
              maxLength={500}
              disabled={pending}
              className="min-w-0 flex-1 bg-background"
            />
            <Button
              type="submit"
              disabled={pending || instruction.trim().length < 2}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {pending ? "Retouche…" : "Modifier"}
            </Button>
          </form>
          {previous ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                setSubject(previous.subject);
                setBody(previous.body);
                setPrevious(null);
                setMsg("Version précédente rétablie.");
              }}
            >
              <Undo2 className="size-3.5" aria-hidden />
              Annuler la retouche
            </Button>
          ) : null}
        </div>
      ) : null}

      {msg ? (
        <p
          className={
            msg.startsWith("Mail") || msg.startsWith("Version")
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
