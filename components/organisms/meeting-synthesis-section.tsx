"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isVisitReportHeading } from "@/src/core/domain/visit-report";
import { cn } from "@/lib/utils";

type WritingState = "idle" | "writing" | "done" | "failed";

/**
 * Le compte rendu de visite, pièce maîtresse de la fiche : il ouvre la page
 * dans un cadre de marque, avec « Copier » en bouton principal.
 *
 * Le texte affiché est exactement le texte copié : les titres de rubrique sont
 * écrits en capitales dans le texte même, et la fiche se contente de les
 * mettre en valeur. Replié par défaut : le compte rendu complet fait une
 * centaine de lignes, et la fiche a d'autres blocs à montrer.
 *
 * Quand le compte rendu manque sur un rendez-vous analysé, la fiche le demande
 * à l'ouverture (`writeMeetingId`) : il s'écrit à ce moment-là, en une minute
 * environ, et s'affiche dès qu'il est prêt, sans recharger la page.
 */
export function MeetingSynthesisSection({
  meetingSynthesis,
  fromAi,
  writeMeetingId = null,
}: {
  meetingSynthesis: string;
  fromAi: boolean;
  /** Défini quand le compte rendu manque et doit s'écrire à l'ouverture. */
  writeMeetingId?: string | null;
}) {
  const [written, setWritten] = useState("");
  const [writingState, setWritingState] = useState<WritingState>("idle");
  const [copied, setCopied] = useState(false);
  const [folded, setFolded] = useState(true);

  useEffect(() => {
    if (!writeMeetingId) return;
    const controller = new AbortController();

    const run = async () => {
      setWritingState("writing");
      try {
        const response = await fetch(
          `/api/meetings/${encodeURIComponent(writeMeetingId)}/visit-report`,
          { method: "POST", signal: controller.signal },
        );
        if (!response.ok) {
          setWritingState("failed");
          return;
        }
        const text = (await response.text()).trim();
        setWritten(text);
        setWritingState(text ? "done" : "failed");
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error("visit report writing failed", cause);
          setWritingState("failed");
        }
      }
    };
    void run();
    return () => controller.abort();
  }, [writeMeetingId]);

  const isAiText = fromAi || writingState === "done";
  const writing = writingState === "writing";
  const text = (writingState === "done" ? written : meetingSynthesis).trim();
  const canCopy = isAiText && text.length > 0;
  const lines = text.split("\n");
  const foldable = isAiText && lines.length > 14;

  async function copyReport() {
    if (!canCopy) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="overflow-hidden rounded-2xl border-[1.5px] border-brand/30 bg-card shadow-md">
      <div className="flex flex-wrap items-center gap-3 border-b border-brand/30 bg-gradient-to-b from-brand-soft to-[#f7f4ff] px-5 py-4 dark:from-brand/15 dark:to-brand/5">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15.5px] font-bold tracking-tight">
            Compte rendu de visite
          </h2>
          <p className="text-muted-foreground mt-0.5 text-[12.5px]">
            Prêt à coller dans votre CRM. Le rendez-vous est documenté en un
            clic.
          </p>
        </div>
        <Button
          type="button"
          disabled={!canCopy}
          aria-label={copied ? "Compte rendu copié" : "Copier le compte rendu"}
          onClick={() => void copyReport()}
        >
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {copied ? "Compte rendu copié" : "Copier le compte rendu"}
        </Button>
      </div>

      <div
        className={cn(
          "relative px-5 pt-3 pb-4",
          foldable && folded && "max-h-80 overflow-hidden",
        )}
      >
        {writing ? (
          <p
            className="text-muted-foreground text-[13px] leading-7"
            role="status"
            aria-live="polite"
          >
            <span
              aria-hidden
              className="bg-brand mr-2 inline-block size-2 animate-pulse rounded-full align-middle motion-reduce:animate-none"
            />
            Rédaction du compte rendu… Une minute environ, le temps de lire tout
            le transcript.
          </p>
        ) : (
          <div
            className="text-foreground text-[13px] leading-7 break-words whitespace-pre-wrap"
            aria-live={writeMeetingId ? "polite" : undefined}
          >
            {lines.map((line, index) =>
              isAiText &&
              isVisitReportHeading(
                line,
                index > 0 ? lines[index - 1] : undefined,
              ) ? (
                <p
                  key={index}
                  className="text-brand mt-3 text-[11.5px] font-bold tracking-wide first:mt-0"
                >
                  {line}
                </p>
              ) : (
                <p key={index} className={line.trim() ? undefined : "h-3"}>
                  {line}
                </p>
              ),
            )}
          </div>
        )}
        {foldable && folded ? (
          <div
            aria-hidden
            className="from-card/0 to-card pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b"
          />
        ) : null}
        {!isAiText && !writing ? (
          <p className="text-muted-foreground mt-3 text-xs">
            {writingState === "failed"
              ? "Le compte rendu n'a pas pu être rédigé pour l'instant. Rechargez la page pour réessayer."
              : "Le compte rendu complet apparaîtra une fois l'analyse automatique terminée."}
          </p>
        ) : null}
      </div>

      {isAiText ? (
        <div className="bg-muted/40 flex flex-wrap items-center gap-3 border-t px-5 py-2.5">
          <span className="text-muted-foreground text-xs">
            {text.length.toLocaleString("fr-FR")} caractères, générés à partir
            du transcript, de la grille et des profils.
          </span>
          <span className="flex-1" />
          {foldable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFolded((f) => !f)}
            >
              {folded ? "Tout afficher" : "Replier"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
