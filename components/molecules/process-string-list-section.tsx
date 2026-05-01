"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { coachListAddSecondaryButtonClass } from "@/lib/coach-list-add-button-class";

export type ProcessStringListItem = { id: string; value: string };

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/** Stable across SSR/client; unique per index + value at first paint. */
export function processItemsFromStrings(
  prefix: "mt" | "pl",
  values: string[],
): ProcessStringListItem[] {
  return values.map((value, index) => ({
    id: `${prefix}-${index}-${simpleHash(value)}`,
    value,
  }));
}

export function newProcessRowId(): string {
  return crypto.randomUUID();
}

const draftToolbarSecondaryClass = cn(
  "px-4 text-sm shadow-none",
  "border border-neutral-200 bg-[#F5F5F5] text-foreground hover:bg-[#EBEBEB] dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700",
);

function ProcessSortableRow({
  value,
  onSave,
  onDelete,
  sortable,
  maxLen,
}: {
  value: string;
  onSave: (next: string) => void;
  onDelete: () => void;
  maxLen: number;
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    dragAttributes: DraggableAttributes;
    dragListeners: DraggableSyntheticListeners;
    isDragging: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const t = draft.trim();
    if (t.length === 0) {
      setDraft(value);
      setEditing(false);
      return;
    }
    onSave(t.slice(0, maxLen));
    setEditing(false);
  }

  return (
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={cn(sortable?.isDragging && "relative z-[1]")}
    >
      <div
        className={cn(
          "group border-border flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 transition-colors",
          "hover:border-brand/20 hover:bg-brand/5",
          sortable?.isDragging && "border-brand/30 bg-brand/5 shadow-sm",
        )}
      >
        {editing ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, maxLen))}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(value);
                  setEditing(false);
                }
              }}
            />
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={commit}
              >
                Enregistrer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(value);
                  setEditing(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
            {sortable ? (
              <button
                type="button"
                className={cn(
                  "text-muted-foreground hover:text-foreground -ml-1 shrink-0 cursor-grab touch-none rounded-md p-1.5 active:cursor-grabbing",
                  "hover:bg-muted/80 outline-none",
                )}
                aria-label="Glisser pour réordonner"
                {...sortable.dragAttributes}
                {...(sortable.dragListeners ?? {})}
              >
                <GripVertical className="size-4" />
              </button>
            ) : null}
            <span className="min-w-0 flex-1 text-sm leading-snug">{value}</span>
            <div className="flex shrink-0 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Modifier"
                onClick={() => {
                  setDraft(value);
                  setEditing(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                aria-label="Supprimer"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function SortableProcessStringRow({
  item,
  setItems,
  maxLen,
}: {
  item: ProcessStringListItem;
  setItems: Dispatch<SetStateAction<ProcessStringListItem[]>>;
  maxLen: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ProcessSortableRow
      value={item.value}
      maxLen={maxLen}
      sortable={{
        setNodeRef,
        style,
        dragAttributes: attributes,
        dragListeners: listeners,
        isDragging,
      }}
      onSave={(next) =>
        setItems((xs) =>
          xs.map((r) => (r.id === item.id ? { ...r, value: next } : r)),
        )
      }
      onDelete={() => setItems((xs) => xs.filter((r) => r.id !== item.id))}
    />
  );
}

function ProcessSortableList({
  items,
  setItems,
  maxLen,
}: {
  items: ProcessStringListItem[];
  setItems: Dispatch<SetStateAction<ProcessStringListItem[]>>;
  maxLen: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const oldIndex = current.findIndex((x) => x.id === active.id);
      const newIndex = current.findIndex((x) => x.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <SortableProcessStringRow
              key={item.id}
              item={item}
              setItems={setItems}
              maxLen={maxLen}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

export type ProcessStringListSectionProps = {
  label: string;
  addButtonLabel: string;
  draftPlaceholder: string;
  items: ProcessStringListItem[];
  setItems: Dispatch<SetStateAction<ProcessStringListItem[]>>;
  maxItems?: number;
  maxLen?: number;
};

/**
 * Liste ordonnable + ajout (même flux que l’étape Process de l’onboarding).
 */
export function ProcessStringListSection({
  label,
  addButtonLabel,
  draftPlaceholder,
  items,
  setItems,
  maxItems = 40,
  maxLen = 120,
}: ProcessStringListSectionProps) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function addFromDraft() {
    const v = draft.trim().slice(0, maxLen);
    if (!v || items.length >= maxItems) return;
    setItems((xs) => [...xs, { id: newProcessRowId(), value: v }]);
    setDraft("");
    setDraftOpen(false);
  }

  const atMax = items.length >= maxItems;

  return (
    <div className="space-y-3">
      <Label className="text-foreground">{label}</Label>
      <ProcessSortableList items={items} setItems={setItems} maxLen={maxLen} />
      {draftOpen ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-brand/30 bg-brand/5 p-3 sm:flex-row sm:items-center">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={draftPlaceholder}
            className="flex-1"
            maxLength={maxLen}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromDraft();
              }
              if (e.key === "Escape") {
                setDraft("");
                setDraftOpen(false);
              }
            }}
          />
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={draftToolbarSecondaryClass}
              disabled={!draft.trim() || atMax}
              onClick={addFromDraft}
            >
              Ajouter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft("");
                setDraftOpen(false);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        className={coachListAddSecondaryButtonClass}
        disabled={atMax}
        onClick={() => {
          setDraftOpen(true);
          setDraft("");
        }}
      >
        {addButtonLabel}
      </Button>
    </div>
  );
}
