"use client";

import { useCallback, useEffect, useState } from "react";
import {
  captureTargetElementFromDom,
  resolveMeaningfulPickerTarget,
} from "@/lib/feedback-target-capture";
import type { FeedbackTargetElement } from "@/src/core/domain/feedback-target-element";
import { Button } from "@/components/ui/button";

type Props = {
  onSelect: (target: FeedbackTargetElement) => void;
  onSkip: () => void;
  onCancel: () => void;
};

export function FeedbackElementPickerOverlay({ onSelect, onSkip, onCancel }: Props) {
  const [hovered, setHovered] = useState<Element | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const updateHover = useCallback((clientX: number, clientY: number) => {
    const raw = document.elementFromPoint(clientX, clientY);
    const target = resolveMeaningfulPickerTarget(raw);
    if (!target) {
      setHovered(null);
      setHoverRect(null);
      return;
    }
    setHovered(target);
    setHoverRect(target.getBoundingClientRect());
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      data-feedback-overlay
      className="fixed inset-0 z-[100] cursor-crosshair"
      onMouseMove={(event) => updateHover(event.clientX, event.clientY)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const raw = document.elementFromPoint(event.clientX, event.clientY);
        const target = resolveMeaningfulPickerTarget(raw);
        if (!target) return;
        onSelect(captureTargetElementFromDom(target));
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      {hoverRect ? (
        <>
          <div
            className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/20"
            style={{
              top: hoverRect.top,
              left: hoverRect.left,
              width: hoverRect.width,
              height: hoverRect.height,
            }}
          />
          <div
            className="pointer-events-none absolute rounded bg-blue-600 px-2 py-0.5 text-xs text-white shadow"
            style={{
              top: Math.max(8, hoverRect.top - 28),
              left: hoverRect.left,
            }}
          >
            {hovered?.tagName.toLowerCase()}
            {hovered?.getAttribute("data-feedback-id")
              ? ` · ${hovered.getAttribute("data-feedback-id")}`
              : ""}
          </div>
        </>
      ) : null}

      <div
        data-feedback-overlay
        className="pointer-events-auto fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"
      >
        <p className="text-muted-foreground self-center text-sm">
          Cliquez sur l&apos;élément concerné
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onSkip}>
          Passer
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
