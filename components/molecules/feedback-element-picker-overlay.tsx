"use client";

import { useCallback, useEffect, useState } from "react";
import {
  captureTargetElementFromDom,
  pickElementAtPoint,
} from "@/lib/feedback-target-capture";
import type { FeedbackTargetElement } from "@/src/core/domain/feedback-target-element";
import { Button } from "@/components/ui/button";

type Props = {
  onSelect: (target: FeedbackTargetElement) => void;
  onCancel: () => void;
};

export function FeedbackElementPickerOverlay({ onSelect, onCancel }: Props) {
  const [hovered, setHovered] = useState<Element | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const updateHover = useCallback((clientX: number, clientY: number) => {
    const target = pickElementAtPoint(clientX, clientY);
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
    function onMouseMove(event: MouseEvent) {
      updateHover(event.clientX, event.clientY);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", onMouseMove, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", onMouseMove, true);
    };
  }, [onCancel, updateHover]);

  return (
    <div
      data-feedback-overlay
      className="fixed inset-0 z-[100] cursor-crosshair"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const target = pickElementAtPoint(event.clientX, event.clientY);
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
            className="pointer-events-none absolute max-w-[min(20rem,calc(100vw-1rem))] truncate rounded bg-blue-600 px-2 py-0.5 text-xs text-white shadow"
            style={{
              top: Math.max(8, hoverRect.top - 28),
              left: `clamp(8px, ${hoverRect.left}px, calc(100vw - 100% - 8px))`,
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
        className="pointer-events-auto fixed bottom-6 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur"
      >
        <p className="text-muted-foreground text-center text-sm">
          Survolez un élément puis cliquez pour le sélectionner
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Retour
        </Button>
      </div>
    </div>
  );
}
