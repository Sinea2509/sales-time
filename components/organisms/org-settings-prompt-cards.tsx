"use client";

import { useId, useRef, useState, useTransition } from "react";
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
const ALREADY_ORIGIN_MESSAGE =
  "Cette consigne est déjà celle d'origine de Sales Time.";
const FAILED_MESSAGE =
  "L'enregistrement n'a pas abouti. Rechargez la page, puis réessayez.";
const ALREADY_ORIGIN_HINT =
  "Cette consigne est déjà celle d'origine de Sales Time";
const RESET_HINT = "Remet la consigne d'origine de Sales Time";
const CONFIRM_RESET_HINT =
  "La consigne d'origine de Sales Time remplacera la vôtre pour les prochaines analyses";

const maxCharsLabel = ORGANIZATION_PROMPT_MAX_CHARS.toLocaleString("fr-FR");

/**
 * « Réinitialiser », en deux temps.
 *
 * Le premier clic demande de confirmer, le second rétablit la consigne
 * d'origine. La version du manager reste en base, mais aucun écran ne la
 * retrouve : un clic distrait la lui ferait perdre.
 *
 * Grisé, le bouton garde le focus et le survol (`focusableWhenDisabled`) :
 * son infobulle dit pourquoi à la souris, et le texte masqué qu'il désigne
 * le dit au lecteur d'écran.
 */
function ResetControl({
  title,
  modified,
  pending,
  onReset,
}: {
  title: string;
  modified: boolean;
  pending: boolean;
  onReset: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const hintId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const disabled = !modified || pending;
  const confirming = armed && !disabled;
  const hint = !modified
    ? ALREADY_ORIGIN_HINT
    : confirming
      ? CONFIRM_RESET_HINT
      : RESET_HINT;

  return (
    <span
      className="inline-flex items-center gap-1"
      onBlur={(event) => {
        // Le focus quitte le couple de boutons : la demande de confirmation tombe.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setArmed(false);
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              ref={buttonRef}
              type="button"
              size="sm"
              variant={confirming ? "destructive" : "ghost"}
              focusableWhenDisabled
              disabled={disabled}
              aria-label={
                confirming
                  ? `Confirmer la réinitialisation de la consigne ${title}`
                  : `Réinitialiser la consigne ${title}`
              }
              aria-describedby={hintId}
              className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent"
              onClick={() => {
                if (disabled) return;
                if (!armed) {
                  setArmed(true);
                  return;
                }
                setArmed(false);
                onReset();
              }}
            />
          }
        >
          {confirming ? "Confirmer la réinitialisation" : "Réinitialiser"}
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
      <span id={hintId} className="sr-only">
        {hint}
      </span>
      {confirming ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setArmed(false);
            buttonRef.current?.focus();
          }}
        >
          Garder ma version
        </Button>
      ) : null}
    </span>
  );
}

/**
 * La pastille d'état : modifiée, ou consigne d'origine.
 *
 * L'auteur d'une modification s'affiche au survol, comme dans la maquette,
 * et se lit aussi dans un texte masqué : ni un lecteur d'écran ni une
 * tablette ne survolent.
 */
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
      {card.badgeTooltip ? (
        <span className="sr-only"> ({card.badgeTooltip})</span>
      ) : null}
    </span>
  );
  if (!card.badgeTooltip) return badge;
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex rounded-full" />}>
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
 * Sans droit de modification, les cartes disent l'état de chaque consigne,
 * sans bouton : le texte des consignes reste entre les mains des managers.
 */
export function OrgSettingsPromptCards({
  cards,
  canEdit,
  organizationId,
}: {
  cards: OrganizationPromptCardView[];
  canEdit: boolean;
  /** L'organisation de la page : l'action refuse d'écrire si la session a changé. */
  organizationId: string;
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
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const openCard = canEdit
    ? (cards.find((card) => card.kind === openKind) ?? null)
    : null;
  const unchanged = openCard ? draft.trim() === openCard.markdown.trim() : true;
  const tooLong = draft.trim().length > ORGANIZATION_PROMPT_MAX_CHARS;

  function openEditor(card: OrganizationPromptCardView) {
    setDraft(card.markdown);
    setDialogError(null);
    setConfirmDiscard(false);
    setMessage(null);
    setOpenKind(card.kind);
  }

  function closeEditor() {
    setOpenKind(null);
    setDialogError(null);
    setConfirmDiscard(false);
  }

  /*
    Fermer la fenêtre ne doit pas jeter vingt minutes de rédaction : un clic
    à côté ne la ferme pas, et la touche d'échappement, la croix ou
    « Annuler » demandent de confirmer quand le texte a changé.
  */
  function requestClose() {
    if (pending) return;
    if (!unchanged) {
      setConfirmDiscard(true);
      return;
    }
    closeEditor();
  }

  function save() {
    if (!openCard) return;
    const checked = checkOrganizationPromptMarkdown(draft);
    if (!checked.ok) {
      setDialogError(checked.message);
      return;
    }
    const kind = openCard.kind;
    setConfirmDiscard(false);
    startTransition(async () => {
      try {
        const result = await saveOrganizationPromptAction({
          expectedOrganizationId: organizationId,
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
      } catch {
        // Le brouillon reste dans la fenêtre : rien n'est perdu.
        setDialogError(FAILED_MESSAGE);
      }
    });
  }

  function reset(kind: OrganizationPromptKind, fromDialog: boolean) {
    function showError(text: string) {
      if (fromDialog) setDialogError(text);
      else setMessage({ type: "err", text });
    }
    startTransition(async () => {
      try {
        const result = await resetOrganizationPromptAction({
          expectedOrganizationId: organizationId,
          kind,
        });
        if (!result.ok) {
          showError(result.message);
          return;
        }
        closeEditor();
        setMessage({
          type: "ok",
          text: result.changed ? RESET_MESSAGE : ALREADY_ORIGIN_MESSAGE,
        });
        router.refresh();
      } catch {
        showError(FAILED_MESSAGE);
      }
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
              {canEdit ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Modifier la consigne ${card.title}`}
                    onClick={() => openEditor(card)}
                  >
                    Modifier la consigne
                  </Button>
                  <ResetControl
                    title={card.title}
                    modified={card.modified}
                    pending={pending}
                    onReset={() => reset(card.kind, false)}
                  />
                </>
              ) : null}
              <PromptBadge card={card} />
            </CardContent>
          </Card>
        ))}
      </div>

      {canEdit ? (
        <Dialog
          open={openCard !== null}
          disablePointerDismissal
          onOpenChange={(open) => {
            if (!open) requestClose();
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
                  readOnly={pending}
                  className="max-h-[55vh] min-h-[300px] overflow-y-auto leading-relaxed"
                />
                <p
                  className={cn(
                    "text-right text-xs tabular-nums",
                    tooLong ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {draft.trim().length.toLocaleString("fr-FR")} /{" "}
                  {maxCharsLabel} caractères
                </p>
              </div>

              {dialogError ? (
                <p className="text-destructive text-sm" role="alert">
                  {dialogError}
                </p>
              ) : null}

              {confirmDiscard ? (
                <div
                  role="alert"
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
                >
                  <p>
                    Vos modifications ne sont pas enregistrées. Voulez-vous les
                    abandonner ?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      autoFocus
                      onClick={() => setConfirmDiscard(false)}
                    >
                      Continuer la modification
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={closeEditor}
                    >
                      Abandonner mes modifications
                    </Button>
                  </div>
                </div>
              ) : null}

              <p className="text-muted-foreground text-xs leading-relaxed">
                Votre modification ne s&apos;appliquera qu&apos;aux rendez-vous
                analysés après l&apos;enregistrement. Les analyses déjà faites
                gardent leur compte rendu.
              </p>

              <DialogFooter className="sm:justify-between">
                <ResetControl
                  title={openCard.title}
                  modified={openCard.modified}
                  pending={pending}
                  onReset={() => reset(openCard.kind, true)}
                />
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={requestClose}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    disabled={pending || unchanged}
                    onClick={save}
                    className="bg-brand text-brand-foreground hover:bg-brand-hover"
                  >
                    Enregistrer en nouvelle version
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          ) : null}
        </Dialog>
      ) : null}
    </div>
  );
}
