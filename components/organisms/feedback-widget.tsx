"use client";

import { useCallback, useState, useTransition } from "react";
import { MessageSquarePlus, MousePointerClick, PenLine } from "lucide-react";
import { submitFeedbackAction } from "@/app/[locale]/company/feedback-actions";
import { FeedbackElementPickerOverlay } from "@/components/molecules/feedback-element-picker-overlay";
import { FeedbackScreenshotPreview } from "@/components/molecules/feedback-screenshot-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  snapshotFeedbackConsoleErrors,
  snapshotFeedbackConsoleWarnings,
} from "@/lib/feedback-console-capture";
import { snapshotFeedbackNetworkErrors } from "@/lib/feedback-network-capture";
import {
  captureElementCropBlob,
  captureFeedbackScreenshot,
  uploadFeedbackScreenshotBlob,
} from "@/lib/feedback-screenshot-capture";
import { buildClientTechnicalContextSnapshot } from "@/src/core/domain/feedback-technical-context";
import type { FeedbackTargetElement } from "@/src/core/domain/feedback-target-element";
import type { FeedbackPriority, FeedbackType } from "@/src/core/ports/feedback-repository-port";

type WidgetPhase = "idle" | "choose" | "picking" | "form";

export function FeedbackWidget() {
  const [phase, setPhase] = useState<WidgetPhase>("idle");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<FeedbackType>("BUG");
  const [priority, setPriority] = useState<FeedbackPriority>("HIGH");
  const [targetElement, setTargetElement] = useState<FeedbackTargetElement | null>(
    null,
  );
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScreenshotCapture = useCallback(async (target: FeedbackTargetElement | null) => {
    setCapturing(true);
    const { dataUrl } = await captureFeedbackScreenshot({ targetElement: target });
    setScreenshotDataUrl(dataUrl);
    setCapturing(false);
  }, []);

  function resetWidget() {
    setPhase("idle");
    setMessage("");
    setType("BUG");
    setPriority("HIGH");
    setTargetElement(null);
    setScreenshotDataUrl(null);
    setDone(false);
    setError(null);
  }

  function openChoose() {
    setDone(false);
    setError(null);
    setPhase("choose");
  }

  function startPicker() {
    setDone(false);
    setError(null);
    setPhase("picking");
  }

  function openForm(target: FeedbackTargetElement | null) {
    setTargetElement(target);
    setPhase("form");
    void runScreenshotCapture(target);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      let screenshotUrl: string | null = null;
      let elementCropUrl: string | null = null;

      const { blob } = await captureFeedbackScreenshot({ targetElement });
      if (blob) {
        screenshotUrl = await uploadFeedbackScreenshotBlob(blob, "feedback");
      }

      if (targetElement) {
        const cropBlob = await captureElementCropBlob(targetElement);
        if (cropBlob) {
          elementCropUrl = await uploadFeedbackScreenshotBlob(cropBlob, "feedback-crop");
        }
      }

      const technicalContext = buildClientTechnicalContextSnapshot();
      const res = await submitFeedbackAction({
        type,
        message,
        priority,
        screenshotUrl,
        targetElement,
        elementCropUrl,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        locale: navigator.language,
        consoleErrors: snapshotFeedbackConsoleErrors(),
        consoleWarnings: snapshotFeedbackConsoleWarnings(),
        networkErrors: snapshotFeedbackNetworkErrors(),
        scrollPosition: technicalContext.scrollPosition,
        routePath: technicalContext.routePath,
      });

      if (!res.ok) {
        setError("Envoi impossible. Réessayez.");
        return;
      }

      setDone(true);
      setMessage("");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        data-feedback-id="feedback-open"
        onClick={openChoose}
      >
        <MessageSquarePlus className="size-3.5" />
        Feedback
      </Button>

      {phase === "picking" ? (
        <FeedbackElementPickerOverlay
          onSelect={(target) => openForm(target)}
          onCancel={() => setPhase("choose")}
        />
      ) : null}

      <Dialog
        open={phase === "choose" || phase === "form"}
        onOpenChange={(open) => {
          if (!open) resetWidget();
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-md overflow-y-auto" data-feedback-dialog>
          {phase === "choose" ? (
            <>
              <DialogHeader>
                <DialogTitle>Envoyer un feedback</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm">
                Ciblez un élément de la page ou envoyez un retour général.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex-col items-start gap-2 px-4 py-4 text-left"
                  data-feedback-id="feedback-choose-element"
                  onClick={startPicker}
                >
                  <MousePointerClick className="size-5 shrink-0 text-blue-600" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">Sélectionner un élément</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      Survolez la page avec le curseur et cliquez sur la zone concernée.
                    </span>
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex-col items-start gap-2 px-4 py-4 text-left"
                  data-feedback-id="feedback-choose-form"
                  onClick={() => openForm(null)}
                >
                  <PenLine className="size-5 shrink-0" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">Remplir le formulaire</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      Décrivez votre retour sans cibler un élément précis.
                    </span>
                  </span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Envoyer un feedback</DialogTitle>
              </DialogHeader>
              {done ? (
                <p className="text-sm text-emerald-700">
                  Merci — votre retour a été enregistré.
                </p>
              ) : (
                <div className="min-w-0 space-y-4">
              {targetElement ? (
                <div className="bg-muted/40 min-w-0 overflow-hidden rounded-lg border p-3 text-xs">
                  <p className="font-medium">Élément ciblé</p>
                  <p className="text-muted-foreground mt-1 break-words">
                    {targetElement.tagName}
                    {targetElement.dataFeedbackId
                      ? ` · ${targetElement.dataFeedbackId}`
                      : ""}
                  </p>
                  {targetElement.textSnippet ? (
                    <p className="mt-1 break-words">&quot;{targetElement.textSnippet}&quot;</p>
                  ) : null}
                  <p className="text-muted-foreground mt-1 break-all font-mono text-[11px] leading-relaxed">
                    {targetElement.cssSelector}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Aucun élément ciblé — capture pleine page.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="feedback-type">Type</Label>
                <select
                  id="feedback-type"
                  className={nativeSelectClassName}
                  value={type}
                  onChange={(e) => {
                    const nextType = e.target.value as FeedbackType;
                    setType(nextType);
                    if (nextType === "BUG") setPriority("HIGH");
                    else if (priority === "HIGH") setPriority("MEDIUM");
                  }}
                >
                  <option value="BUG">Bug</option>
                  <option value="IDEA">Idée</option>
                  <option value="QUESTION">Question</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-priority">Priorité</Label>
                <select
                  id="feedback-priority"
                  className={nativeSelectClassName}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="CRITICAL">Critique</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message">Message</Label>
                <Textarea
                  id="feedback-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez le problème ou votre suggestion…"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Aperçu capture</Label>
                <FeedbackScreenshotPreview
                  dataUrl={screenshotDataUrl}
                  loading={capturing}
                  onRecapture={() => void runScreenshotCapture(targetElement)}
                />
              </div>

              {error ? <p className="text-destructive text-sm">{error}</p> : null}
              <Button
                type="button"
                disabled={pending || message.trim().length < 5}
                onClick={handleSubmit}
                data-feedback-id="feedback-submit"
              >
                {pending ? "Envoi…" : "Envoyer"}
              </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
