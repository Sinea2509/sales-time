"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMeetingAction } from "@/app/[locale]/company/rendez-vous/actions";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { FileDropzone } from "@/components/molecules/file-dropzone";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

const TRANSCRIPT_ACCEPT =
  ".txt,.csv,.md,.vtt,.srt,.doc,.docx,.pdf,text/plain";
const TRANSCRIPT_MAX_BYTES = 4 * 1024 * 1024;

const outcomes = [
  { value: "WON", label: "Gagné" },
  { value: "LOST", label: "Perdu" },
  { value: "FOLLOW_UP", label: "Suivi" },
  { value: "NO_SHOW", label: "Absent" },
  { value: "OTHER", label: "Autre" },
] as const;

const feelingLabels = [
  "Très insatisfait",
  "Insatisfait",
  "Neutre",
  "Satisfait",
  "Très satisfait",
];

type MeetingCreateFormProps = {
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
  variant?: "page" | "dialog";
  onSuccess?: (meetingId: string) => void;
  onCancel?: () => void;
};

export function MeetingCreateForm({
  meetingTypeOptions,
  pipelineStageOptions,
  variant = "page",
  onSuccess,
  onCancel,
}: MeetingCreateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feeling, setFeeling] = useState(3);
  const [useUpload, setUseUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const isDialog = variant === "dialog";

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        setError(null);
        fd.set("feeling", String(feeling));
        if (useUpload && file) {
          fd.set("transcriptFile", file);
        }
        startTransition(async () => {
          try {
            const res = await createMeetingAction(fd);
            if (!res.ok) {
              setError(
                res.error === "VALIDATION"
                  ? "Vérifiez les champs obligatoires."
                  : res.error === "INVALID_PERSON"
                    ? "Contact introuvable. Rechargez la page ou choisissez un autre contact."
                    : res.error === "QUOTA_EXHAUSTED"
                      ? "Quota d'analyses épuisé — passez au plan pour continuer."
                      : res.error === "UNSUPPORTED_FORMAT"
                        ? "Format non pris en charge (.txt, .csv, .md, .vtt, .srt, .doc, .docx, .pdf)."
                        : res.error === "TRANSCRIPT_TOO_SHORT"
                          ? "Le transcript est trop court (minimum 20 caractères)."
                          : res.error === "EXTRACTION_FAILED"
                            ? "Impossible de lire le contenu du fichier. Vérifiez qu'il n'est pas protégé ou corrompu, ou collez le texte."
                            : res.error,
              );
              return;
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
          <ContactPicker />
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
          <Label htmlFor="meetingType">Type de rendez-vous</Label>
          <select
            id="meetingType"
            name="meetingType"
            className={nativeSelectClassName}
          >
            <option value="">—</option>
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
          >
            <option value="">—</option>
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
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outcome">Résultat</Label>
          <select
            id="outcome"
            name="outcome"
            className={nativeSelectClassName}
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="feeling">
            Ressenti après le RDV — {feeling}/5 ({feelingLabels[feeling - 1]})
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

      <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
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
              hint="Formats : .txt, .csv, .md, .vtt, .srt, .doc, .docx, .pdf — 4 Mo max."
            />
            <Textarea
              id="transcript"
              name="transcript"
              rows={4}
              placeholder="Texte complémentaire (optionnel si le fichier contient le transcript)"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="transcript">Transcript / compte-rendu</Label>
            <Textarea
              id="transcript"
              name="transcript"
              required
              rows={8}
              placeholder="Collez ou saisissez le transcript de l'échange…"
            />
          </div>
        )}
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
            className="bg-brand text-white hover:bg-brand-hover"
          >
            {pending ? "Enregistrement…" : "Enregistrer et lancer l'analyse"}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          disabled={pending}
          className={cn("bg-brand text-white hover:bg-brand-hover")}
        >
          {pending ? "Enregistrement…" : "Enregistrer et lancer l'analyse"}
        </Button>
      )}
    </form>
  );
}
