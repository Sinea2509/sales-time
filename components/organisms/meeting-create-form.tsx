"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createMeetingAction,
  updateMeetingAction,
} from "@/app/[locale]/company/rendez-vous/actions";
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
  pipelineStageOptions: string[];
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
  if (res.error === "FORBIDDEN" || res.error === "NOT_FOUND") {
    return isEditMode
      ? "Impossible de modifier ce rendez-vous."
      : "Impossible d'enregistrer ce rendez-vous.";
  }
  return res.error;
}

export function MeetingCreateForm({
  meetingTypeOptions,
  pipelineStageOptions,
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
  const [useUpload, setUseUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const isDialog = variant === "dialog";
  const isEdit = mode === "edit" && initialValues != null;

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
              "Échec de l'envoi. Si vous importez un fichier volumineux, réessayez avec un fichier plus léger.",
            );
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
        <div className="space-y-2">
          <Label htmlFor="pipelineStage">Étape pipeline</Label>
          <select
            id="pipelineStage"
            name="pipelineStage"
            className={nativeSelectClassName}
            defaultValue={initialValues?.pipelineStage ?? ""}
          >
            <option value="">Non précisé</option>
            {pipelineStageOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
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
              checked={!useUpload}
              onChange={() => setUseUpload(false)}
            />
            Coller le transcript
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="sourceMode"
              checked={useUpload}
              onChange={() => setUseUpload(true)}
            />
            Importer un fichier (.txt, .csv, .doc, .docx, .pdf…)
          </label>
        </div>
        {useUpload ? (
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
            {pending
              ? "Enregistrement et analyse…"
              : isEdit
                ? "Enregistrer les modifications"
                : "Enregistrer le rendez-vous"}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          disabled={pending}
          className={cn("bg-brand text-brand-foreground hover:bg-brand-hover")}
          data-feedback-id="meeting-create-submit"
        >
          {pending
            ? "Enregistrement et analyse…"
            : isEdit
              ? "Enregistrer les modifications"
              : "Enregistrer le rendez-vous"}
        </Button>
      )}
    </form>
  );
}
