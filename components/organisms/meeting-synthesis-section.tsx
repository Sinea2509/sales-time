"use client";

import { useEffect, useState } from "react";
import { CopyTextButton } from "@/components/molecules/copy-text-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StreamState = "idle" | "streaming" | "done" | "failed";

/** Les intitulés de section imposés au compte rendu, mis en gras à l'écran. */
const SECTION_LABELS = [
  "Compte-rendu de visite",
  "Compte rendu de visite",
  "Contexte :",
  "Sujets abordés :",
  "Points clés :",
  "Engagements / décisions :",
  "Prochaines étapes :",
];

const FOLDED_HEIGHT = 320;

function isSectionLine(line: string): boolean {
  const trimmed = line.trim();
  return SECTION_LABELS.some((label) => trimmed.startsWith(label));
}

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

/**
 * Le compte rendu de visite, pièce maîtresse de la fiche : il ouvre la page
 * dans un cadre de marque, avec « Copier » en bouton principal. Tout le
 * reste de la fiche est le détail qui l'explique.
 */
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
  const [streamed, setStreamed] = useState("");
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [folded, setFolded] = useState(true);

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
  const streaming = showStreamed && streamState === "streaming";
  const lines = text.split("\n");
  const long = text.length > 900;

  return (
    <section className="overflow-hidden rounded-2xl border-[1.5px] border-brand/30 bg-card shadow-md">
      <div className="flex flex-wrap items-center gap-3 border-b border-brand/30 bg-gradient-to-b from-brand-soft to-[#f7f4ff] px-5 py-4 dark:from-brand/15 dark:to-brand/5">
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-bold tracking-tight">
            Compte rendu de visite
          </h2>
          <p className="text-muted-foreground mt-0.5 text-[12.5px]">
            Prêt à coller dans votre CRM. Le rendez-vous est documenté en un
            clic.
          </p>
        </div>
        <span className="flex-1" />
        <CopyTextButton
          text={isAiText ? text : ""}
          label="Copier le compte rendu"
          variant="default"
          size="default"
        />
      </div>

      <div
        className={cn(
          "relative px-5 pt-1 pb-4",
          folded && long && "overflow-hidden",
        )}
        style={folded && long ? { maxHeight: FOLDED_HEIGHT } : undefined}
      >
        {streaming && !streamed ? (
          <p
            className="text-muted-foreground pt-4 text-[13px] leading-[1.75]"
            role="status"
            aria-live="polite"
          >
            Rédaction du compte rendu…
          </p>
        ) : (
          <pre
            className="m-0 pt-4 font-sans text-[13px] leading-[1.75] break-words whitespace-pre-wrap"
            aria-live={showStreamed ? "polite" : undefined}
          >
            {lines.map((line, i) =>
              isAiText && isSectionLine(line) ? (
                <b
                  key={i}
                  className="text-brand-hover block text-[11.4px] font-bold tracking-[.035em] uppercase dark:text-brand-muted"
                >
                  {line}
                </b>
              ) : (
                <span key={i}>
                  {line}
                  {i < lines.length - 1 ? "\n" : null}
                </span>
              ),
            )}
            {streaming ? (
              <span
                aria-hidden
                className="bg-brand ml-0.5 inline-block h-[1em] w-[2px] animate-pulse align-text-bottom motion-reduce:animate-none"
              />
            ) : null}
          </pre>
        )}
        {folded && long ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-card"
          />
        ) : null}
        {!isAiText && !streaming ? (
          <p className="text-muted-foreground mt-3 text-xs">
            {streamState === "failed"
              ? "Le compte rendu n'a pas pu être rédigé pour l'instant. Rechargez la page pour réessayer."
              : "Le compte rendu complet apparaîtra une fois l'analyse automatique terminée."}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/40 px-5 py-2.5">
        <span className="text-muted-foreground text-[11.5px]">
          {isAiText
            ? `${text.length.toLocaleString("fr-FR")} caractères, généré à partir du transcript, de la scorecard et des profils.`
            : "Généré à partir du transcript, de la scorecard et des profils."}
        </span>
        <span className="flex-1" />
        {long ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFolded((v) => !v)}
          >
            {folded ? "Tout afficher" : "Replier"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
