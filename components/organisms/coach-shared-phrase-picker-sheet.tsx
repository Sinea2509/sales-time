"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  listCoachSharedPhrases,
  type CoachSharedPhraseRow,
} from "@/app/[locale]/company/coach-shared-phrases-actions";
import { normalizePhraseKey } from "@/lib/onboarding-shared-default-phrases";
import { cn } from "@/lib/utils";

export type CoachPhrasePickerKind = "OBJECTION" | "ARGUMENT";

const secondaryGreyClass =
  "border-border bg-secondary hover:bg-secondary/80 border text-foreground shadow-none dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700";

type Props = {
  kind: CoachPhrasePickerKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Phrases déjà dans la liste du formulaire (normalisées pour masquer les doublons). */
  alreadyChosen: string[];
  onAddToList: (texts: string[]) => void;
};

export function CoachSharedPhrasePickerSheet({
  kind,
  open,
  onOpenChange,
  title,
  description,
  alreadyChosen,
  onAddToList,
}: Props) {
  const [phrases, setPhrases] = useState<CoachSharedPhraseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [ownError, setOwnError] = useState<string | null>(null);

  const chosenSet = useMemo(
    () => new Set(alreadyChosen.map((t) => normalizePhraseKey(t))),
    [alreadyChosen],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const r = await listCoachSharedPhrases(kind);
    setLoading(false);
    if (!r.ok) {
      setLoadError(r.message);
      setPhrases([]);
      return;
    }
    setPhrases(r.phrases);
  }, [kind]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setSelectedIds(new Set());
      setFilter("");
      setNewPhrase("");
      setOwnError(null);
      onOpenChange(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!open) return;
    startTransition(() => {
      void load();
    });
  }, [open, load]);

  const visiblePhrases = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return phrases.filter((p) => {
      if (chosenSet.has(normalizePhraseKey(p.text))) return false;
      if (!q) return true;
      return p.text.toLowerCase().includes(q);
    });
  }, [phrases, filter, chosenSet]);

  const builtins = visiblePhrases.filter((p) => p.source === "builtin");

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    const texts = phrases
      .filter((p) => selectedIds.has(p.id))
      .map((p) => p.text.trim())
      .filter(Boolean);
    if (texts.length === 0) {
      handleOpenChange(false);
      return;
    }
    onAddToList(texts);
    setSelectedIds(new Set());
    handleOpenChange(false);
  }

  /*
    Une formulation saisie ici va dans la liste de l'organisation, et nulle
    part ailleurs. Elle partait dans une collection partagée avec toutes les
    organisations clientes : l'objection d'un client devenait lisible par ses
    concurrents.
  */
  function handleAddOwn() {
    const t = newPhrase.trim();
    if (t.length < 3) {
      setOwnError("Minimum 3 caractères.");
      return;
    }
    if (chosenSet.has(normalizePhraseKey(t))) {
      setOwnError("Cette formulation est déjà dans votre liste.");
      return;
    }
    setOwnError(null);
    onAddToList([t]);
    setNewPhrase("");
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-dvh w-full max-w-lg flex-col sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        {loadError ? (
          <p className="text-destructive px-1 text-sm" role="alert">
            {loadError}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-1">
          <div className="space-y-2">
            <Label htmlFor="phrase-filter">Rechercher</Label>
            <Input
              id="phrase-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrer les suggestions…"
              disabled={loading}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 pb-2">
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (
              <>
                <PhraseBlock
                  heading="Suggestions"
                  items={builtins}
                  selectedIds={selectedIds}
                  onToggle={toggle}
                />
              </>
            )}
          </div>

          <div className="border-border space-y-2 rounded-xl border bg-muted/20 p-3">
            <Label htmlFor="new-phrase">Votre formulation</Label>
            <p className="text-muted-foreground text-xs">
              Elle s&apos;ajoute à la liste de votre organisation, et
              d&apos;aucune autre.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-phrase"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                maxLength={300}
                placeholder="Votre formulation…"
              />
              <Button
                type="button"
                variant="secondary"
                className={cn("shrink-0", secondaryGreyClass)}
                onClick={handleAddOwn}
              >
                Ajouter à ma liste
              </Button>
            </div>
            {ownError ? (
              <p className="text-destructive text-xs">{ownError}</p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
            className={cn(
              "text-brand-foreground rounded-md border-0 shadow-sm",
              "bg-brand hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover",
            )}
          >
            Ajouter à ma liste
            {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PhraseBlock({
  heading,
  sub,
  items,
  selectedIds,
  onToggle,
}: {
  heading: string;
  sub?: string;
  items: CoachSharedPhraseRow[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-foreground text-sm font-semibold">{heading}</h3>
      {sub ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{sub}</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                selectedIds.has(p.id)
                  ? "border-brand/50 bg-brand/8"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-brand"
                checked={selectedIds.has(p.id)}
                onChange={() => onToggle(p.id)}
              />
              <span className="min-w-0 leading-snug">{p.text}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
