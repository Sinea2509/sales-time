"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationCoach } from "@/app/[locale]/company/settings/actions";
import { CoachSharedPhrasePickerSheet } from "@/components/organisms/coach-shared-phrase-picker-sheet";
import { cn } from "@/lib/utils";
import { coachListAddSecondaryButtonClass } from "@/lib/coach-list-add-button-class";
import { mergeUniqueCoachPhrases } from "@/lib/coach-shared-phrases-merge";
import { Link } from "@/i18n/navigation";

export type OrgCoachFormInitial = {
  companyPitch: string;
  objections: string[];
  keyArguments: string[];
  industryVocabulary: string;
};

function sanitizeObjections(list: string[]): string[] {
  return list
    .map((o) => o.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 30);
}

function sanitizeKeyArguments(list: string[]): string[] {
  return list
    .map((o) => o.trim().slice(0, 400))
    .filter(Boolean)
    .slice(0, 30);
}

export function OrgSettingsCoachForm({
  initial,
  canEdit = true,
}: {
  initial: OrgCoachFormInitial;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [companyPitch, setCompanyPitch] = useState(initial.companyPitch);
  const [objections, setObjections] = useState<string[]>(() => [
    ...initial.objections,
  ]);
  const [keyArguments, setKeyArguments] = useState<string[]>(() => [
    ...initial.keyArguments,
  ]);
  const [industryVocabulary, setIndustryVocabulary] = useState(
    initial.industryVocabulary,
  );

  const [objectionPickerOpen, setObjectionPickerOpen] = useState(false);
  const [argumentPickerOpen, setArgumentPickerOpen] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setMessage(null);
    startTransition(async () => {
      const r = await updateOrganizationCoach({
        companyPitch: companyPitch.trim() || null,
        objections: sanitizeObjections(objections),
        keyArguments: sanitizeKeyArguments(keyArguments),
        industryVocabulary: industryVocabulary.trim() || null,
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
            message.type === "ok"
              ? "text-green-700 dark:text-green-400"
              : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="org-pitch">Pitch entreprise</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {companyPitch.length}/500
          </span>
        </div>
        <Textarea
          id="org-pitch"
          value={companyPitch}
          onChange={(e) => setCompanyPitch(e.target.value.slice(0, 500))}
          rows={4}
          readOnly={!canEdit}
          disabled={!canEdit}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base">Objections principales</Label>
        <ul className="space-y-2">
          {objections.map((o, i) => (
            <li key={`${i}-${o.slice(0, 12)}`} className="flex gap-2 text-sm">
              <span className="border-border flex-1 rounded-md border px-3 py-2">
                {o}
              </span>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setObjections((xs) => xs.filter((_, j) => j !== i))
                  }
                >
                  Retirer
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {canEdit ? (
          <Button
            type="button"
            variant="secondary"
            className={coachListAddSecondaryButtonClass}
            onClick={() => setObjectionPickerOpen(true)}
          >
            + Ajouter une objection
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        <Label className="text-base">
          Arguments clés &amp; différenciateurs
        </Label>
        <ul className="space-y-2">
          {keyArguments.map((o, i) => (
            <li key={`${i}-${o.slice(0, 12)}`} className="flex gap-2 text-sm">
              <span className="border-border flex-1 rounded-md border px-3 py-2">
                {o}
              </span>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setKeyArguments((xs) => xs.filter((_, j) => j !== i))
                  }
                >
                  Retirer
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {canEdit ? (
          <Button
            type="button"
            variant="secondary"
            className={coachListAddSecondaryButtonClass}
            onClick={() => setArgumentPickerOpen(true)}
          >
            + Ajouter un argument
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="org-vocab">Vocabulaire métier</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {industryVocabulary.length}/500
          </span>
        </div>
        <Textarea
          id="org-vocab"
          value={industryVocabulary}
          onChange={(e) => setIndustryVocabulary(e.target.value.slice(0, 500))}
          rows={3}
          readOnly={!canEdit}
          disabled={!canEdit}
        />
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Les consignes KISS par quadrant (global / manager / commercial) sont
        gérées au niveau plateforme par un super administrateur :{" "}
        <Link
          href="/admin/prompts/kiss-consignes"
          className="text-brand font-medium underline underline-offset-2"
        >
          Consignes KISS par quadrant
        </Link>
        .
      </p>

      {canEdit ? (
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-brand-foreground hover:bg-brand-hover"
        >
          Enregistrer
        </Button>
      ) : null}

      {canEdit ? (
        <>
          <CoachSharedPhrasePickerSheet
            kind="OBJECTION"
            open={objectionPickerOpen}
            onOpenChange={setObjectionPickerOpen}
            title="Objections · collection partagée"
            description="Choisissez des formulations existantes ou créez-en une nouvelle pour tout le monde."
            alreadyChosen={objections}
            onAddToList={(texts) =>
              setObjections((xs) => mergeUniqueCoachPhrases(xs, texts))
            }
          />
          <CoachSharedPhrasePickerSheet
            kind="ARGUMENT"
            open={argumentPickerOpen}
            onOpenChange={setArgumentPickerOpen}
            title="Arguments · collection partagée"
            description="Choisissez des formulations existantes ou créez-en une nouvelle pour tout le monde."
            alreadyChosen={keyArguments}
            onAddToList={(texts) =>
              setKeyArguments((xs) => mergeUniqueCoachPhrases(xs, texts))
            }
          />
        </>
      ) : null}
    </form>
  );
}
