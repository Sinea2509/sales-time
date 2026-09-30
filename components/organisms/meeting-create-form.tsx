"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createMeetingAction,
  getAudioUploadPathnameAction,
  updateMeetingAction,
} from "@/app/[locale]/company/rendez-vous/actions";
import {
  AUDIO_ACCEPT,
  AUDIO_MAX_BYTES,
  audioMediaTypeFor,
} from "@/lib/audio-transcript";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { FileDropzone } from "@/components/molecules/file-dropzone";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dispatchMeetingMutation } from "@/lib/meeting-mutation-event";
import { MEETING_OUTCOME_OPTIONS } from "@/lib/meeting-outcome-display";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";
import { toDatetimeLocalValue } from "@/lib/datetime-local-value";
import { cn } from "@/lib/utils";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

const TRANSCRIPT_ACCEPT = ".txt,.csv,.md,.vtt,.srt,.doc,.docx,.pdf,text/plain";
const TRANSCRIPT_MAX_BYTES = 4 * 1024 * 1024;

type SourceMode = "paste" | "file" | "audio";

/** Où en est l'envoi d'un enregistrement : la seule attente qui se voit. */
type AudioPhase =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number }
  | { kind: "transcribing" };

const feelingLabels = [
  "Très insatisfait",
  "Insatisfait",
  "Neutre",
  "Satisfait",
  "Très satisfait",
];

export type MeetingFormInitialValues = {
  meetingId: string;
  personId: string;
  prospectName: string;
  meetingAtIso: string;
  durationMin: number | null;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
  outcome: MeetingOutcome;
  feeling: number;
  transcript: string;
  notes: string | null;
};

type MeetingCreateFormProps = {
  meetingTypeOptions: string[];
  variant?: "page" | "dialog";
  mode?: "create" | "edit";
  initialValues?: MeetingFormInitialValues;
  onSuccess?: (meetingId: string) => void;
  onCancel?: () => void;
};

function mapSubmitError(
  res: { ok: false; error: string },
  isEditMode: boolean,
): string {
  if (res.error === "VALIDATION") {
    return "Vérifiez les champs obligatoires.";
  }
  if (res.error === "INVALID_PERSON") {
    return "Contact introuvable. Rechargez la page ou choisissez un autre contact.";
  }
  if (res.error === "QUOTA_EXHAUSTED") {
    return "Quota d'analyses épuisé. Passez au plan pour continuer.";
  }
  if (res.error === "UNSUPPORTED_FORMAT") {
    return "Format non pris en charge (.txt, .csv, .md, .vtt, .srt, .doc, .docx, .pdf).";
  }
  if (res.error === "TRANSCRIPT_TOO_SHORT") {
    return "Le transcript est trop court (minimum 20 caractères).";
  }
  if (res.error === "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS") {
    return "Votre transcript est trop court pour être analysé.";
  }
  if (res.error === "EXTRACTION_FAILED") {
    return "Impossible de lire le contenu du fichier. Vérifiez qu'il n'est pas protégé ou corrompu, ou collez le texte.";
  }
  if (res.error === "AUDIO_TOO_LARGE") {
    return "Enregistrement trop lourd (maximum 20 Mo, environ 45 minutes en m4a). Coupez-le ou compressez-le.";
  }
  if (res.error === "AUDIO_NOT_FOUND") {
    return "L'enregistrement n'a pas été retrouvé. Réessayez l'envoi.";
  }
  if (res.error === "TRANSCRIPTION_FAILED") {
    return "La transcription a échoué. Réessayez dans un instant, ou collez le transcript si vous l'avez.";
  }
  if (res.error === "AI_NOT_CONFIGURED") {
    return "La transcription n'est pas disponible sur cette plateforme.";
  }
  if (res.error === "FORBIDDEN" || res.error === "NOT_FOUND") {
    return isEditMode
      ? "Impossible de modifier ce rendez-vous."
      : "Impossible d'enregistrer ce rendez-vous.";
  }
  return res.error;
}

export function MeetingCreateForm({
  meetingTypeOptions,
  variant = "page",
  mode = "create",
  initialValues,
  onSuccess,
  onCancel,
}: MeetingCreateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feeling, setFeeling] = useState(initialValues?.feeling ?? 3);
  const [sourceMode, setSourceMode] = useState<SourceMode>("paste");
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPhase, setAudioPhase] = useState<AudioPhase>({ kind: "idle" });
  const isDialog = variant === "dialog";
  const isEdit = mode === "edit" && initialValues != null;
  const useUpload = sourceMode === "file";
  const useAudio = sourceMode === "audio" && !isEdit;

  /*
    L'enregistrement part directement du navigateur vers le stockage, puis
    le serveur le transcrit : la barre montre l'envoi, le libellé du bouton
    dit la transcription. Sans cela, une minute de silence après le clic
    ressemble à une page plantée.
  */
  async function uploadAudio(next: File): Promise<{
    url: string;
    mediaType: string;
  }> {
    const target = await getAudioUploadPathnameAction(next.name);
    if (!target.ok) throw new Error(target.error);
    const mediaType = audioMediaTypeFor(next.name, next.type);
    setAudioPhase({ kind: "uploading", percent: 0 });
    const blob = await upload(target.pathname, next, {
      access: "public",
      handleUploadUrl: "/api/meetings/audio-upload",
      contentType: mediaType,
      onUploadProgress: (p) =>
        setAudioPhase({ kind: "uploading", percent: Math.round(p.percentage) }),
    });
    setAudioPhase({ kind: "transcribing" });
    return { url: blob.url, mediaType };
  }

  const submitLabel = pending
    ? audioPhase.kind === "uploading"
      ? `Envoi de l'enregistrement… ${audioPhase.percent} %`
      : audioPhase.kind === "transcribing"
        ? "Transcription puis analyse…"
        : "Enregistrement et analyse…"
    : isEdit
      ? "Enregistrer les modifications"
      : "Enregistrer le rendez-vous";

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null);
        fd.set("feeling", String(feeling));
        if (isEdit && initialValues) {
          fd.set("meetingId", initialValues.meetingId);
        }
        if (useUpload && file) {
          fd.set("transcriptFile", file);
        }
        startTransition(async () => {
          try {
            if (useAudio) {
              if (!audioFile) {
                setError("Choisissez un enregistrement audio.");
                return;
              }
              const uploaded = await uploadAudio(audioFile);
              fd.set("audioBlobUrl", uploaded.url);
              fd.set("audioMediaType", uploaded.mediaType);
            }
            const res = isEdit
              ? await updateMeetingAction(fd)
              : await createMeetingAction(fd);
            if (!res.ok) {
              setError(mapSubmitError(res, isEdit));
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
          } catch {
            setError(
              useAudio
                ? "L'envoi de l'enregistrement a échoué. Vérifiez votre connexion et réessayez."
                : "Échec de l'envoi. Si vous importez un fichier volumineux, réessayez avec un fichier plus léger.",
            );
          } finally {
            setAudioPhase({ kind: "idle" });
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <ContactPicker
            initialPersonId={initialValues?.personId ?? null}
            initialProspectName={initialValues?.prospectName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meetingAt">Date du rendez-vous</Label>
          <Input
            id="meetingAt"
            name="meetingAt"
            type="datetime-local"
            required
            defaultValue={
              initialValues
                ? toDatetimeLocalValue(new Date(initialValues.meetingAtIso))
                : undefined
            }
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
            defaultValue={initialValues?.durationMin ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meetingType">Type de rendez-vous</Label>
          <select
            id="meetingType"
            name="meetingType"
            className={nativeSelectClassName}
            defaultValue={initialValues?.meetingType ?? ""}
          >
            <option value="">Non précisé</option>
            {meetingTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {/*
          L'étape du pipeline n'est plus demandée : la revue du 2 septembre l'a
          retirée du formulaire, le commercial renseigne son interlocuteur et
          son entreprise, rien de plus. Sales Time analyse des rendez-vous, il
          ne remplace pas le CRM. La colonne reste en base, et un rendez-vous
          qui portait déjà une étape la garde à la modification : le champ
          caché la renvoie telle quelle, sans quoi l'enregistrement l'effacerait.
        */}
        {isEdit ? (
          <input
            type="hidden"
            name="pipelineStage"
            value={initialValues.pipelineStage ?? ""}
          />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="potentialAmount">Montant potentiel (€)</Label>
          <Input
            id="potentialAmount"
            name="potentialAmount"
            type="number"
            min={0}
            step="0.01"
            placeholder="Optionnel"
            defaultValue={initialValues?.potentialAmount ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outcome">Résultat</Label>
          <select
            id="outcome"
            name="outcome"
            className={nativeSelectClassName}
            defaultValue={initialValues?.outcome ?? "FOLLOW_UP"}
            required
          >
            {MEETING_OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="feeling">
            {/* L'espace avant le deux-points est insécable : la typographie
                française l'exige, et sans elle le « : » passe seul à la ligne
                quand le libellé se replie sur un écran étroit. */}
            {`Ressenti après le RDV : ${feeling}/5 (${feelingLabels[feeling - 1]})`}
          </Label>
          <input
            id="feeling"
            type="range"
            min={1}
            max={5}
            step={1}
            value={feeling}
            onChange={(e) => setFeeling(Number(e.target.value))}
            className="w-full accent-brand"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4 dark:border-neutral-800">
        <div className="flex flex-wrap gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="sourceMode"
              checked={sourceMode === "paste"}
              onChange={() => setSourceMode("paste")}
            />
            Coller le transcript
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="sourceMode"
              checked={sourceMode === "file"}
              onChange={() => setSourceMode("file")}
            />
            Importer un fichier (.txt, .csv, .doc, .docx, .pdf…)
          </label>
          {!isEdit ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="sourceMode"
                checked={sourceMode === "audio"}
                onChange={() => setSourceMode("audio")}
              />
              Importer un enregistrement audio
            </label>
          ) : null}
        </div>
        {useAudio ? (
          <div className="space-y-2">
            <Label htmlFor="audioFile">Enregistrement du rendez-vous</Label>
            <FileDropzone
              id="audioFile"
              accept={AUDIO_ACCEPT}
              maxBytes={AUDIO_MAX_BYTES}
              file={audioFile}
              onFileChange={setAudioFile}
              disabled={pending}
              hint="Formats acceptés : .mp3, .m4a, .aac, .wav, .webm, .ogg. Taille maximale : 20 Mo, soit environ 45 minutes en m4a. La transcription prend une à deux minutes."
            />
            {audioPhase.kind === "uploading" ? (
              <div
                role="progressbar"
                aria-label="Envoi de l'enregistrement"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={audioPhase.percent}
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="bg-brand h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${audioPhase.percent}%` }}
                />
              </div>
            ) : null}
            <Textarea
              id="transcript"
              name="transcript"
              rows={3}
              placeholder="Texte complémentaire (optionnel)"
            />
          </div>
        ) : useUpload ? (
          <div className="space-y-2">
            <Label htmlFor="transcriptFile">Fichier transcript</Label>
            <FileDropzone
              id="transcriptFile"
              accept={TRANSCRIPT_ACCEPT}
              maxBytes={TRANSCRIPT_MAX_BYTES}
              file={file}
              onFileChange={setFile}
              disabled={pending}
              hint="Formats acceptés : .txt, .csv, .md, .vtt, .srt, .doc, .docx, .pdf. Taille maximale : 4 Mo."
            />
            <Textarea
              id="transcript"
              name="transcript"
              rows={4}
              placeholder="Texte complémentaire (optionnel si le fichier contient le transcript)"
              defaultValue={isEdit ? initialValues?.transcript : undefined}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript / compte-rendu</Label>
            <Textarea
              id="transcript"
              name="transcript"
              required={!isEdit}
              rows={8}
              placeholder="Collez ou saisissez le transcript de l'échange…"
              defaultValue={isEdit ? initialValues?.transcript : undefined}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialValues?.notes ?? undefined}
        />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {isDialog ? (
        <DialogFooter className="-mx-4 -mb-4 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
            data-feedback-id="meeting-create-submit"
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          disabled={pending}
          className={cn("bg-brand text-brand-foreground hover:bg-brand-hover")}
          data-feedback-id="meeting-create-submit"
        >
          {submitLabel}
        </Button>
      )}
    </form>
  );
}
