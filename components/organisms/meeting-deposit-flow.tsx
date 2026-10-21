"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ArrowLeft, ClipboardPaste, Sparkles } from "lucide-react";
import {
  createMeetingAction,
  getAudioUploadPathnameAction,
  prepareMeetingDepositAction,
} from "@/app/[locale]/company/rendez-vous/actions";
import {
  AUDIO_ACCEPT,
  AUDIO_MAX_BYTES,
  audioMediaTypeFor,
  isAudioFilename,
} from "@/lib/audio-transcript";
import { readAudioDurationMin } from "@/lib/audio-duration";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { FileDropzone } from "@/components/molecules/file-dropzone";
import { StepRail } from "@/components/molecules/step-rail";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { dispatchMeetingMutation } from "@/lib/meeting-mutation-event";
import { MEETING_OUTCOME_OPTIONS } from "@/lib/meeting-outcome-display";
import { meetingSubmitErrorMessage } from "@/lib/meeting-submit-error";
import { toDatetimeLocalValue } from "@/lib/datetime-local-value";
import type { MeetingPrefill } from "@/src/core/domain/meeting-prefill";
import { cn } from "@/lib/utils";

const TRANSCRIPT_ACCEPT = ".txt,.csv,.md,.vtt,.srt,.doc,.docx,.pdf,text/plain";
const TRANSCRIPT_MAX_BYTES = 4 * 1024 * 1024;

const STEPS = [
  { id: 1, label: "Déposer" },
  { id: 2, label: "Vérifier" },
] as const;

const FEELINGS = [
  "Très insatisfait",
  "Insatisfait",
  "Neutre",
  "Satisfait",
  "Très satisfait",
];

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number }
  | { kind: "reading"; audio: boolean };

type Prepared = {
  transcript: string;
  sourceType: "TRANSCRIPT" | "UPLOAD";
  sourceBlobUrl: string | null;
  prefill: MeetingPrefill;
};

type Props = {
  variant?: "page" | "dialog";
  onSuccess?: (meetingId: string) => void;
  onCancel?: () => void;
  meetingTypeOptions: string[];
};

/** Un champ rempli par Sales Time : le commercial sait ce qu'il doit relire. */
function ReadFromConversation() {
  return (
    <span className="text-brand inline-flex items-center gap-1 text-xs font-medium">
      <Sparkles className="size-3" aria-hidden />
      Lu dans la conversation
    </span>
  );
}

function FieldLabel({
  htmlFor,
  children,
  prefilled,
}: {
  htmlFor: string;
  children: ReactNode;
  prefilled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Label htmlFor={htmlFor}>{children}</Label>
      {prefilled ? <ReadFromConversation /> : null}
    </div>
  );
}

/**
 * Déposer un rendez-vous en deux temps : d'abord la conversation, puis une
 * fiche que Sales Time a préremplie et que le commercial vérifie.
 *
 * Demande de Thomas du 21 octobre 2026. L'ancien formulaire demandait une
 * dizaine de champs avant de pouvoir déposer quoi que ce soit ; c'est le
 * geste répété à chaque rendez-vous, et chaque champ en moins compte. La
 * modification d'un rendez-vous garde le formulaire complet
 * (`MeetingCreateForm`).
 */
export function MeetingDepositFlow({
  variant = "page",
  onSuccess,
  onCancel,
  meetingTypeOptions,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [feeling, setFeeling] = useState<number | null>(null);
  const isDialog = variant === "dialog";

  const canPrepare = Boolean(file) || pasted.trim().length > 0;

  /*
    L'enregistrement part directement du navigateur vers le stockage : une
    requête vers le serveur est plafonnée à quelques mégaoctets, un
    enregistrement d'une demi-heure en pèse vingt.
  */
  async function uploadAudio(next: File) {
    const target = await getAudioUploadPathnameAction(next.name);
    if (!target.ok) throw new Error(target.error);
    const mediaType = audioMediaTypeFor(next.name, next.type);
    setPhase({ kind: "uploading", percent: 0 });
    const blob = await upload(target.pathname, next, {
      access: "public",
      handleUploadUrl: "/api/meetings/audio-upload",
      contentType: mediaType,
      onUploadProgress: (p) =>
        setPhase({ kind: "uploading", percent: Math.round(p.percentage) }),
    });
    return { url: blob.url, mediaType };
  }

  function prepare() {
    setError(null);
    const isAudio = file != null && isAudioFilename(file.name);
    if (file && !isAudio && file.size > TRANSCRIPT_MAX_BYTES) {
      setError(
        "Ce fichier texte dépasse 4 Mo. Collez plutôt son contenu, ou allégez-le.",
      );
      return;
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        let audioDuration: Promise<number | null> = Promise.resolve(null);
        if (file && isAudio) {
          audioDuration = readAudioDurationMin(file);
          const uploaded = await uploadAudio(file);
          fd.set("audioBlobUrl", uploaded.url);
          fd.set("audioMediaType", uploaded.mediaType);
        } else if (file) {
          fd.set("transcriptFile", file);
        }
        if (pasted.trim()) fd.set("transcript", pasted.trim());
        setPhase({ kind: "reading", audio: isAudio });
        const res = await prepareMeetingDepositAction(fd);
        if (!res.ok) {
          setError(meetingSubmitErrorMessage(res, false));
          return;
        }
        const duration = await audioDuration;
        setPrepared({
          transcript: res.transcript,
          sourceType: res.sourceType,
          sourceBlobUrl: res.sourceBlobUrl,
          prefill: {
            ...res.prefill,
            durationMin: res.prefill.durationMin ?? duration,
          },
        });
      } catch {
        setError(
          isAudio
            ? "L'envoi de l'enregistrement a échoué. Vérifiez votre connexion et réessayez."
            : "La lecture du fichier a échoué. Réessayez, ou collez le texte.",
        );
      } finally {
        setPhase({ kind: "idle" });
      }
    });
  }

  function submit(fd: FormData) {
    if (!prepared) return;
    setError(null);
    fd.set("transcript", prepared.transcript);
    fd.set("preparedSourceType", prepared.sourceType);
    fd.set("preparedSourceBlobUrl", prepared.sourceBlobUrl ?? "");
    fd.set("feeling", feeling == null ? "" : String(feeling));
    startTransition(async () => {
      const res = await createMeetingAction(fd);
      if (!res.ok) {
        setError(meetingSubmitErrorMessage(res, false));
        return;
      }
      if ("sellerUserId" in res && res.sellerUserId) {
        dispatchMeetingMutation({ sellerUserId: res.sellerUserId });
      }
      if (onSuccess) {
        onSuccess(res.meetingId);
      } else {
        router.push(`/company/rendez-vous/${res.meetingId}`);
        router.refresh();
      }
    });
  }

  const preparingLabel =
    phase.kind === "uploading"
      ? `Envoi de l'enregistrement… ${phase.percent} %`
      : phase.kind === "reading"
        ? phase.audio
          ? "Transcription, puis lecture de la conversation…"
          : "Lecture de la conversation…"
        : "Continuer";

  const errorBlock = error ? (
    <p className="text-destructive text-sm" role="alert">
      {error}
    </p>
  ) : null;

  if (!prepared) {
    return (
      <div className="space-y-5">
        <StepRail steps={STEPS} current={1} />
        <p className="text-muted-foreground text-sm">
          Déposez l&apos;enregistrement ou le transcript (Teams, Zoom, Meet…).
          Sales Time lit la conversation et remplit la fiche pour vous.
        </p>
        {pasting ? (
          <div className="space-y-2">
            <Label htmlFor="deposit-transcript">Texte de la conversation</Label>
            <Textarea
              id="deposit-transcript"
              rows={10}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              disabled={pending}
              placeholder="Collez ici le transcript de l'échange…"
              autoFocus
            />
            <button
              type="button"
              className="text-brand text-sm font-medium hover:underline"
              onClick={() => {
                setPasting(false);
                setPasted("");
              }}
              disabled={pending}
            >
              Déposer un fichier à la place
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <FileDropzone
              id="deposit-file"
              accept={`${AUDIO_ACCEPT},${TRANSCRIPT_ACCEPT}`}
              maxBytes={AUDIO_MAX_BYTES}
              file={file}
              onFileChange={setFile}
              disabled={pending}
              hint="Enregistrement : .mp3, .m4a, .wav… jusqu'à 20 Mo (environ 45 minutes en m4a). Transcript : .vtt, .docx, .txt, .pdf… jusqu'à 4 Mo."
            />
            <button
              type="button"
              className="text-brand inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
              onClick={() => {
                setPasting(true);
                setFile(null);
              }}
              disabled={pending}
            >
              <ClipboardPaste className="size-4" aria-hidden />
              Ou collez le texte de la conversation
            </button>
          </div>
        )}
        {phase.kind === "uploading" ? (
          <div
            role="progressbar"
            aria-label="Envoi de l'enregistrement"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase.percent}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="bg-brand h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${phase.percent}%` }}
            />
          </div>
        ) : null}
        {errorBlock}
        <div
          className={cn(
            "flex flex-wrap items-center gap-3",
            isDialog ? "justify-end" : "justify-start",
          )}
        >
          {isDialog ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onCancel}
            >
              Annuler
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={prepare}
            disabled={pending || !canPrepare}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
            data-feedback-id="meeting-deposit-continue"
          >
            {preparingLabel}
          </Button>
        </div>
      </div>
    );
  }

  const p = prepared.prefill;
  const anythingRead =
    p.prospectName != null ||
    p.meetingType != null ||
    p.outcome != null ||
    p.meetingDate != null;
  const today = toDatetimeLocalValue(new Date()).slice(0, 10);

  const submitButton = (
    <Button
      type="submit"
      disabled={pending}
      className="bg-brand text-brand-foreground hover:bg-brand-hover"
      data-feedback-id="meeting-create-submit"
    >
      {pending ? "Enregistrement et analyse…" : "Lancer l'analyse"}
    </Button>
  );
  const backButton = (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        setPrepared(null);
        setError(null);
      }}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Changer de fichier
    </Button>
  );

  return (
    <form className="space-y-5" action={submit}>
      <StepRail steps={STEPS} current={2} />
      <div className="bg-brand-soft flex gap-3 rounded-xl border border-brand/20 p-4 text-sm leading-relaxed">
        <Sparkles className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          {anythingRead
            ? "Sales Time a prérempli la fiche à partir de la conversation. Vérifiez-la, corrigez si besoin, puis lancez l'analyse."
            : "Complétez la fiche, puis lancez l'analyse."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          {p.prospectName ? (
            <div className="-mb-1 flex justify-end">
              <ReadFromConversation />
            </div>
          ) : null}
          <ContactPicker initialProspectName={p.prospectName ?? ""} />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="meetingAt" prefilled={p.meetingDate != null}>
            Date du rendez-vous
          </FieldLabel>
          <Input
            id="meetingAt"
            name="meetingAt"
            type="date"
            required
            defaultValue={p.meetingDate ?? today}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="meetingType" prefilled={p.meetingType != null}>
            Type de rendez-vous
          </FieldLabel>
          <select
            id="meetingType"
            name="meetingType"
            className={nativeSelectClassName}
            defaultValue={p.meetingType ?? ""}
          >
            <option value="">Non précisé</option>
            {meetingTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <FieldLabel htmlFor="outcome" prefilled={p.outcome != null}>
            Résultat
          </FieldLabel>
          <select
            id="outcome"
            name="outcome"
            className={nativeSelectClassName}
            defaultValue={p.outcome ?? "FOLLOW_UP"}
            required
          >
            {MEETING_OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="group rounded-xl border border-border p-4 dark:border-neutral-800">
        <summary className="cursor-pointer text-sm font-medium select-none">
          Ajouter des détails{" "}
          <span className="text-muted-foreground font-normal">
            (facultatif : durée, montant, ressenti, notes)
          </span>
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel htmlFor="durationMin" prefilled={p.durationMin != null}>
              Durée (minutes)
            </FieldLabel>
            <Input
              id="durationMin"
              name="durationMin"
              type="number"
              min={0}
              defaultValue={p.durationMin ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel
              htmlFor="potentialAmount"
              prefilled={p.potentialAmount != null}
            >
              Montant potentiel (€)
            </FieldLabel>
            <Input
              id="potentialAmount"
              name="potentialAmount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={p.potentialAmount ?? undefined}
            />
          </div>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium">
              Votre ressenti après le rendez-vous
            </legend>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map((label, i) => {
                const value = i + 1;
                const selected = feeling === value;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFeeling(selected ? null : value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "bg-brand text-brand-foreground border-brand"
                        : "border-border hover:border-brand/40 hover:bg-brand-soft",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
        </div>
      </details>

      <details className="rounded-xl border border-border p-4 dark:border-neutral-800">
        <summary className="cursor-pointer text-sm font-medium select-none">
          Voir la conversation lue
        </summary>
        <Textarea
          className="mt-3 font-mono text-xs"
          rows={10}
          readOnly
          value={prepared.transcript}
          aria-label="Conversation lue"
        />
      </details>

      {errorBlock}
      {isDialog ? (
        <DialogFooter className="-mx-4 -mb-4 mt-2">
          {backButton}
          {submitButton}
        </DialogFooter>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {backButton}
          {submitButton}
        </div>
      )}
    </form>
  );
}
