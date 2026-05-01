"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createContactInlineAction,
  searchContactsPickerAction,
} from "@/app/[locale]/company/contacts/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type Hit = { id: string; displayName: string; company: string | null };

export function ContactPicker() {
  const [query, setQuery] = useState("");
  const [personId, setPersonId] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (prefix: string) => {
    if (!prefix.trim()) {
      setHits([]);
      return;
    }
    setLoading(true);
    const r = await searchContactsPickerAction(prefix);
    setLoading(false);
    if (!r.ok) {
      setHits([]);
      return;
    }
    setHits(r.items);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void runSearch(query);
    }, 280);
    return () => window.clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function onCreateInline() {
    setError(null);
    const name = query.trim();
    if (!name) {
      setError("Saisissez un nom pour créer le contact.");
      return;
    }
    const r = await createContactInlineAction({ displayName: name });
    if (!r.ok) {
      if (r.error === "DUPLICATE") {
        setError(
          "Ce nom correspond déjà à un contact. Choisissez-le dans la liste.",
        );
      } else {
        setError("Création impossible.");
      }
      return;
    }
    setPersonId(r.personId);
    setQuery(r.displayName);
    setOpen(false);
    setHits([]);
  }

  function selectHit(h: Hit) {
    setPersonId(h.id);
    setQuery(h.displayName);
    setOpen(false);
  }

  function onInputChange(v: string) {
    setQuery(v);
    setPersonId(null);
    setOpen(true);
  }

  return (
    <div className="space-y-2" ref={wrapRef}>
      <Label htmlFor="contact-picker-input">Prospect / contact</Label>
      <input type="hidden" name="personId" value={personId ?? ""} />
      <div className="relative">
        <Input
          id="contact-picker-input"
          name="prospectName"
          autoComplete="off"
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher ou saisir un nouveau nom…"
          required
          aria-expanded={open}
          aria-controls="contact-picker-list"
        />
        {open && (hits.length > 0 || query.trim().length > 0) ? (
          <div
            id="contact-picker-list"
            className="bg-popover text-popover-foreground absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-md"
            role="listbox"
          >
            {loading ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                Recherche…
              </div>
            ) : null}
            {!loading &&
              hits.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="hover:bg-muted flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectHit(h)}
                >
                  <span className="font-medium">{h.displayName}</span>
                  {h.company ? (
                    <span className="text-muted-foreground text-xs">
                      {h.company}
                    </span>
                  ) : null}
                </button>
              ))}
            {query.trim().length > 0 ? (
              <button
                type="button"
                className="border-border/80 hover:bg-muted/80 border-t px-3 py-2 text-left text-sm text-brand w-full"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void onCreateInline()}
              >
                Créer « {query.trim()} » comme contact
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {personId ? (
        <p className="text-muted-foreground text-xs">
          Contact existant sélectionné — le rendez-vous sera lié à cette fiche.
        </p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Saisissez un nom : recherche dans vos contacts ou création à la volée.
        </p>
      )}
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
