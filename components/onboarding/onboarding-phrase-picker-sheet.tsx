"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
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
  createOnboardingSharedPhrase,
  listOnboardingSharedPhrases,
  type SharedPhraseRow,
} from "@/app/onboarding/shared-phrases-actions";
import { normalizePhraseKey } from "@/lib/onboarding-shared-default-phrases";
import { cn } from "@/lib/utils";

export type PhrasePickerKind = "OBJECTION" | "ARGUMENT";

const secondaryGreyClass =
  "border border-neutral-200 bg-[#F5F5F5] text-foreground shadow-none hover:bg-[#EBEBEB] dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700";

type Props = {
  kind: PhrasePickerKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Phrases déjà dans la liste du formulaire (normalisées pour masquer les doublons). */
  alreadyChosen: string[];
  onAddToList: (texts: string[]) => void;
};

export function OnboardingPhrasePickerSheet({
  kind,
  open,
  onOpenChange,
  title,
  description,
  alreadyChosen,
  onAddToList,
}: Props) {
  const [phrases, setPhrases] = useState<SharedPhraseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const chosenSet = useMemo(
    () => new Set(alreadyChosen.map((t) => normalizePhraseKey(t))),
    [alreadyChosen],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const r = await listOnboardingSharedPhrases(kind);
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
      setCreateError(null);
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
  const community = visiblePhrases.filter((p) => p.source === "community");

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

  async function handleCreateAndShare() {
    const t = newPhrase.trim();
    if (t.length < 3) {
      setCreateError("Minimum 3 caractères.");
      return;
    }
    setCreateError(null);
    setCreating(true);
    const r = await createOnboardingSharedPhrase({ kind, text: t });
    setCreating(false);
    if (!r.ok) {
      setCreateError(r.message);
      return;
    }
    setPhrases((prev) => {
      if (prev.some((p) => p.id === r.phrase.id)) return prev;
      return [r.phrase, ...prev];
    });
    setSelectedIds((prev) => new Set(prev).add(r.phrase.id));
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
                <PhraseBlock
                  heading="Collection partagée"
                  sub="Proposé par d’autres organisations — vous pouvez en ajouter de nouvelles ci-dessous."
                  items={community}
                  selectedIds={selectedIds}
                  onToggle={toggle}
                />
              </>
            )}
          </div>

          <div className="border-border space-y-2 rounded-xl border bg-muted/20 p-3">
            <Label htmlFor="new-phrase">Créer une nouvelle option (partagée)</Label>
            <p className="text-muted-foreground text-xs">
              Visible par tous pour enrichir les prochains onboardings.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-phrase"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value.slice(0, 300))}
                placeholder="Votre formulation…"
                disabled={creating}
              />
              <Button
                type="button"
                variant="secondary"
                className={cn("shrink-0", secondaryGreyClass)}
                disabled={creating}
                onClick={() => void handleCreateAndShare()}
              >
                Créer et partager
              </Button>
            </div>
            {createError ? (
              <p className="text-destructive text-xs">{createError}</p>
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
              "rounded-lg border-0 text-white shadow-sm",
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
  items: SharedPhraseRow[];
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
