"use client";

import { useState } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditableStringListProps = {
  id: string;
  title: string;
  description?: string;
  items: string[];
  onChange: (next: string[]) => void;
  maxItems?: number;
  maxLen?: number;
};

export function EditableStringList({
  id,
  title,
  description,
  items,
  onChange,
  maxItems = 40,
  maxLen = 120,
}: EditableStringListProps) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function add() {
    const t = draft.trim().slice(0, maxLen);
    if (!t || items.length >= maxItems) return;
    onChange([...items, t]);
    setDraft("");
  }

  function removeAt(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
    if (editingIndex === i) {
      setEditingIndex(null);
      setEditText("");
    }
  }

  function startEdit(i: number) {
    setEditingIndex(i);
    setEditText(items[i] ?? "");
  }

  function saveEdit() {
    if (editingIndex == null) return;
    const t = editText.trim().slice(0, maxLen);
    if (!t) return;
    const next = items.slice();
    next[editingIndex] = t;
    onChange(next);
    setEditingIndex(null);
    setEditText("");
  }

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
      return;
    }
    const next = items.slice();
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`${id}-draft`} className="text-base">
          {title}
        </Label>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>

      <ul className="space-y-1.5" aria-label={title}>
        {items.length === 0 ? (
          <li className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
            Aucun élément — ajoutez-en un ci-dessous.
          </li>
        ) : (
          items.map((text, i) => (
            <li
              key={`${i}-${text.slice(0, 12)}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={() => {
                if (dragIndex == null) return;
                move(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className="bg-card flex items-center gap-2 rounded-lg border px-2 py-1.5"
            >
              <span
                className="text-muted-foreground cursor-grab touch-none px-1 active:cursor-grabbing"
                aria-hidden
              >
                <GripVertical className="size-4" />
              </span>
              {editingIndex === i ? (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    maxLength={maxLen}
                    className="min-w-0 flex-1"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={saveEdit}>
                    OK
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditText("");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm">{text}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    aria-label="Modifier"
                    onClick={() => startEdit(i)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive size-8 shrink-0"
                    aria-label="Supprimer"
                    onClick={() => removeAt(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={`${id}-draft`} className="text-muted-foreground text-xs">
            Nouvel élément
          </Label>
          <Input
            id={`${id}-draft`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={maxLen}
            placeholder="Saisir puis Ajouter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          disabled={items.length >= maxItems || !draft.trim()}
          onClick={add}
        >
          Ajouter
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        {items.length} / {maxItems} — glisser-déposer pour réordonner.
      </p>
    </div>
  );
}
