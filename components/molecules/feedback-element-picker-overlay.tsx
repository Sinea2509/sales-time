"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  captureTargetElementFromDom,
  pickElementAtPoint,
  pickVisualElementAtPoint,
} from "@/lib/feedback-target-capture";
import type { FeedbackTargetElement } from "@/src/core/domain/feedback-target-element";
import { Button } from "@/components/ui/button";

type Props = {
  onSelect: (target: FeedbackTargetElement) => void;
  onCancel: () => void;
};

function readElementLabel(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const feedbackId = element.getAttribute("data-feedback-id");
  return feedbackId ? `${tag} · ${feedbackId}` : tag;
}

export function FeedbackElementPickerOverlay({ onSelect, onCancel }: Props) {
  const [hovered, setHovered] = useState<Element | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  const syncHoverRect = useCallback((element: Element | null) => {
    if (!element) {
      setHoverRect(null);
      return;
    }
    setHoverRect(element.getBoundingClientRect());
  }, []);

  const updateHover = useCallback(
    (clientX: number, clientY: number) => {
      const target = pickVisualElementAtPoint(clientX, clientY);
      setHovered(target);
      syncHoverRect(target);
    },
    [syncHoverRect],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    function onMouseMove(event: MouseEvent) {
      updateHover(event.clientX, event.clientY);
    }
    function onScrollOrResize() {
      if (hovered) syncHoverRect(hovered);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [hovered, onCancel, syncHoverRect, updateHover]);

  return createPortal(
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
      <div className="pointer-events-none fixed inset-0 bg-black/10" />

      {hoverRect ? (
        <>
          <div
            className="pointer-events-none fixed bg-blue-500/15 ring-2 ring-blue-500"
            style={{
              top: hoverRect.top,
              left: hoverRect.left,
              width: hoverRect.width,
              height: hoverRect.height,
            }}
          />
          <div
            className="pointer-events-none fixed max-w-[min(20rem,calc(100vw-1rem))] truncate rounded bg-blue-600 px-2 py-0.5 text-xs text-white shadow"
            style={{
              top: Math.max(8, hoverRect.top - 28),
              left: `clamp(8px, ${hoverRect.left}px, calc(100vw - 100% - 8px))`,
            }}
          >
            {hovered ? readElementLabel(hovered) : null}
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
    </div>,
    document.body,
  );
}
