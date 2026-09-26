"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cardProseBodyClass, sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type StreamState = "idle" | "streaming" | "done" | "failed";

/**
 * Lit la réponse texte morceau par morceau et rend chaque morceau au fur et
 * à mesure. Le compte rendu se compose sous les yeux du lecteur, au lieu
 * d'apparaître d'un bloc dix secondes plus tard.
 */
async function readTextStream(
  response: Response,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
  const tail = decoder.decode();
  if (tail) onChunk(tail);
}

export function MeetingSynthesisSection({
  meetingSynthesis,
  fromAi,
  streamMeetingId = null,
}: {
  meetingSynthesis: string;
  fromAi: boolean;
  /** Défini quand le compte rendu manque et doit s'écrire au fil de l'eau. */
  streamMeetingId?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [streamState, setStreamState] = useState<StreamState>("idle");

  useEffect(() => {
    if (!streamMeetingId) return;
    const controller = new AbortController();
    let received = "";

    const run = async () => {
      setStreamState("streaming");
      try {
        const response = await fetch(
          `/api/meetings/${encodeURIComponent(streamMeetingId)}/visit-report`,
          { method: "POST", signal: controller.signal },
        );
        if (!response.ok) {
          setStreamState("failed");
          return;
        }
        await readTextStream(response, (chunk) => {
          received += chunk;
          setStreamed(received);
        });
        setStreamState(received.trim() ? "done" : "failed");
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("visit report stream failed", cause);
          setStreamState("failed");
        }
      }
    };
    void run();
    return () => controller.abort();
  }, [streamMeetingId]);

  const showStreamed = streamMeetingId != null && streamState !== "failed";
  const text = showStreamed && streamed ? streamed : meetingSynthesis;
  const isAiText = fromAi || streamState === "done";
  const canCopy = isAiText && text.trim().length > 0;

  const copyReport = useCallback(async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(text.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [canCopy, text]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className={sectionHeadingClass}>Compte rendu de visite</h2>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={!canCopy}
          aria-label={
            copied ? "Compte-rendu copié" : "Copier le compte-rendu du rdv"
          }
          title={copied ? "Copié" : "Copier le compte-rendu"}
          onClick={() => void copyReport()}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
        </Button>
      </div>
      <Card>
        <CardContent className={cn("pt-6", cardProseBodyClass)}>
          {showStreamed && streamState === "streaming" && !streamed ? (
            <p
              className="text-muted-foreground leading-relaxed"
              role="status"
              aria-live="polite"
            >
              Rédaction du compte rendu…
            </p>
          ) : (
            <p
              className="leading-relaxed whitespace-pre-wrap"
              aria-live={showStreamed ? "polite" : undefined}
            >
              {text}
              {showStreamed && streamState === "streaming" ? (
                <span
                  aria-hidden
                  className="bg-brand ml-0.5 inline-block h-[1em] w-[2px] animate-pulse align-text-bottom motion-reduce:animate-none"
                />
              ) : null}
            </p>
          )}
          {!isAiText && !(showStreamed && streamState === "streaming") ? (
            <p className="text-muted-foreground mt-3 text-xs">
              {streamState === "failed"
                ? "Le compte rendu n'a pas pu être rédigé pour l'instant. Rechargez la page pour réessayer."
                : meetingSynthesis.includes("en cours de génération") ||
                    meetingSynthesis.includes("analyse automatique")
                  ? "Le compte-rendu complet apparaîtra une fois l'analyse automatique terminée."
                  : "Compte-rendu indicatif : une version enrichie est générée après analyse."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
