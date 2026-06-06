"use client";

import { useState, useTransition } from "react";
import html2canvas from "html2canvas";
import { MessageSquarePlus } from "lucide-react";
import { submitFeedbackAction } from "@/app/[locale]/company/feedback-actions";
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

const consoleBuffer: string[] = [];

if (typeof window !== "undefined") {
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    consoleBuffer.push(
      args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "),
    );
    if (consoleBuffer.length > 20) consoleBuffer.shift();
    orig(...args);
  };
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"BUG" | "IDEA" | "QUESTION" | "OTHER">("BUG");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function captureScreenshot(): Promise<string | null> {
    try {
      const canvas = await html2canvas(document.body, {
        scale: 0.75,
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.85),
      );
      if (!blob) return null;
      const fd = new FormData();
      fd.set("file", blob, "feedback.png");
      const res = await fetch("/api/feedback/screenshot", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { url?: string };
      return json.url ?? null;
    } catch {
      return null;
    }
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const screenshotUrl = await captureScreenshot();
      const res = await submitFeedbackAction({
        type,
        message,
        screenshotUrl,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        locale: navigator.language,
        consoleErrors: [...consoleBuffer],
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
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
      >
        <MessageSquarePlus className="size-3.5" />
        Feedback
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer un feedback</DialogTitle>
          </DialogHeader>
          {done ? (
            <p className="text-sm text-emerald-700">
              Merci — votre retour a été enregistré.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback-type">Type</Label>
                <select
                  id="feedback-type"
                  className={nativeSelectClassName}
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as typeof type)
                  }
                >
                  <option value="BUG">Bug</option>
                  <option value="IDEA">Idée</option>
                  <option value="QUESTION">Question</option>
                  <option value="OTHER">Autre</option>
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
              <p className="text-muted-foreground text-xs">
                Une capture d&apos;écran et le contexte technique seront joints
                automatiquement.
              </p>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
              <Button
                type="button"
                disabled={pending || message.trim().length < 5}
                onClick={handleSubmit}
              >
                {pending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
