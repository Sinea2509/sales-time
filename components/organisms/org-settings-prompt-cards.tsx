"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, PenLine } from "lucide-react";
import {
  resetOrganizationPromptAction,
  saveOrganizationPromptAction,
} from "@/app/[locale]/company/settings/coach-ia/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OrganizationPromptCardView } from "@/lib/organization-prompt-card-view";
import { cn } from "@/lib/utils";
import {
  checkOrganizationPromptMarkdown,
  ORGANIZATION_PROMPT_MAX_CHARS,
  type OrganizationPromptKind,
} from "@/src/core/domain/organization-prompts";

const SAVED_MESSAGE =
  "Consigne enregistrée en nouvelle version. Elle s'applique aux prochaines analyses.";
const RESET_MESSAGE =
  "Consigne d'origine de Sales Time rétablie. Elle s'applique aux prochaines analyses.";
const UNCHANGED_MESSAGE =
  "La consigne n'a pas changé : aucune nouvelle version n'a été enregistrée.";
const ALREADY_ORIGIN_HINT =
  "Cette consigne est déjà celle d'origine de Sales Time";
const RESET_HINT = "Remet la consigne d'origine de Sales Time";

const maxCharsLabel = ORGANIZATION_PROMPT_MAX_CHARS.toLocaleString("fr-FR");

/**
 * « Réinitialiser », avec son infobulle même grisé.
 *
 * Un bouton désactivé ne reçoit plus le survol : l'infobulle est portée par
 * l'enveloppe, qui le reçoit à sa place.
 */
function ResetButton({
  modified,
  pending,
  onReset,
}: {
  modified: boolean;
  pending: boolean;
  onReset: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex" tabIndex={modified ? -1 : 0} />}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!modified || pending}
          onClick={onReset}
        >
          Réinitialiser
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {modified ? RESET_HINT : ALREADY_ORIGIN_HINT}
      </TooltipContent>
    </Tooltip>
  );
}

/** La pastille d'état : modifiée (et par qui), ou consigne d'origine. */
function PromptBadge({ card }: { card: OrganizationPromptCardView }) {
  const Icon = card.modified ? PenLine : CircleCheck;
  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        card.modified
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {card.badge}
    </span>
  );
  if (!card.badgeTooltip) return badge;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex rounded-full" tabIndex={0} />}
        aria-label={`${card.badge}. ${card.badgeTooltip}`}
      >
        {badge}
      </TooltipTrigger>
      <TooltipContent>{card.badgeTooltip}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Les six consignes du coach, une carte chacune, et la fenêtre qui les
 * modifie.
 *
 * Sans droit de modification, la carte ouvre la consigne en lecture seule :
 * un commercial peut lire ce que le coach demande au modèle, pas le changer.
 */
export function OrgSettingsPromptCards({
  cards,
  canEdit,
}: {
  cards: OrganizationPromptCardView[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [openKind, setOpenKind] = useState<OrganizationPromptKind | null>(null);
  const [draft, setDraft] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const openCard = cards.find((card) => card.kind === openKind) ?? null;
  const unchanged = openCard ? draft.trim() === openCard.markdown.trim() : true;
  const tooLong = draft.trim().length > ORGANIZATION_PROMPT_MAX_CHARS;

  function openEditor(card: OrganizationPromptCardView) {
    setDraft(card.markdown);
    setDialogError(null);
    setMessage(null);
    setOpenKind(card.kind);
  }

  function closeEditor() {
    setOpenKind(null);
    setDialogError(null);
  }

  function save() {
    if (!openCard || !canEdit) return;
    const checked = checkOrganizationPromptMarkdown(draft);
    if (!checked.ok) {
      setDialogError(checked.message);
      return;
    }
    const kind = openCard.kind;
    startTransition(async () => {
      const result = await saveOrganizationPromptAction({
        kind,
        markdown: checked.markdown,
      });
      if (!result.ok) {
        setDialogError(result.message);
        return;
      }
      closeEditor();
      setMessage({
        type: "ok",
        text: result.changed ? SAVED_MESSAGE : UNCHANGED_MESSAGE,
      });
      router.refresh();
    });
  }

  function reset(kind: OrganizationPromptKind) {
    if (!canEdit) return;
    startTransition(async () => {
      const result = await resetOrganizationPromptAction({ kind });
      if (!result.ok) {
        if (openKind) setDialogError(result.message);
        else setMessage({ type: "err", text: result.message });
        return;
      }
      closeEditor();
      setMessage({ type: "ok", text: RESET_MESSAGE });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
        <p>
          <strong>
            Une consigne modifiée ne s&apos;applique qu&apos;aux rendez-vous
            analysés après son enregistrement.
          </strong>{" "}
          Les analyses déjà faites ne bougent pas. Si les comptes rendus
          deviennent étranges après une modification, « Réinitialiser » remet la
          consigne d&apos;origine de Sales Time pour les prochaines analyses.
        </p>
      </div>

      {message ? (
        <p
          className={cn(
            "text-sm",
            message.type === "ok" ? "text-green-700" : "text-destructive",
          )}
          role={message.type === "ok" ? "status" : "alert"}
        >
          {message.text}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.kind} size="sm">
            <CardHeader>
              <CardTitle>
                {/*
                  Rang 2 : les cartes pendent directement du titre de la page,
                  comme « Votre argumentaire » plus bas.
                */}
                <h2 className="text-base font-semibold leading-snug">
                  {card.title}
                </h2>
              </CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openEditor(card)}
              >
                {canEdit ? "Modifier la consigne" : "Voir la consigne"}
              </Button>
              {canEdit ? (
                <ResetButton
                  modified={card.modified}
                  pending={pending}
                  onReset={() => reset(card.kind)}
                />
              ) : null}
              <PromptBadge card={card} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={openCard !== null}
        onOpenChange={(open) => {
          if (!open && !pending) closeEditor();
        }}
      >
        {openCard ? (
          <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {openCard.title}
              </DialogTitle>
              <DialogDescription>
                Le rôle et le ton s&apos;éditent librement. La grille, les
                échelles et la règle de preuve sont ajoutées par le produit à
                chaque analyse : elles ne peuvent pas diverger de ce que le
                produit calcule.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Textarea
                aria-label={`Consigne ${openCard.title}`}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setDialogError(null);
                }}
                readOnly={!canEdit}
                className="max-h-[55vh] min-h-[300px] overflow-y-auto leading-relaxed"
              />
              {canEdit ? (
                <p
                  className={cn(
                    "text-right text-xs tabular-nums",
                    tooLong ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {draft.trim().length.toLocaleString("fr-FR")} /{" "}
                  {maxCharsLabel} caractères
                </p>
              ) : null}
            </div>

            {dialogError ? (
              <p className="text-destructive text-sm" role="alert">
                {dialogError}
              </p>
            ) : null}

            {canEdit ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Votre modification ne s&apos;appliquera qu&apos;aux rendez-vous
                analysés après l&apos;enregistrement. Les analyses déjà faites
                gardent leur compte rendu.
              </p>
            ) : null}

            <DialogFooter className="sm:justify-between">
              {canEdit ? (
                <ResetButton
                  modified={openCard.modified}
                  pending={pending}
                  onReset={() => reset(openCard.kind)}
                />
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={closeEditor}
                >
                  {canEdit ? "Annuler" : "Fermer"}
                </Button>
                {canEdit ? (
                  <Button
                    type="button"
                    disabled={pending || unchanged}
                    onClick={save}
                    className="bg-brand text-brand-foreground hover:bg-brand-hover"
                  >
                    Enregistrer en nouvelle version
                  </Button>
                ) : null}
              </div>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
