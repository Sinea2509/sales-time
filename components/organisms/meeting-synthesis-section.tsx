"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isVisitReportHeading } from "@/src/core/domain/visit-report";
import { cn } from "@/lib/utils";

/**
 * Le compte rendu de visite, tel que le commercial le colle dans son CRM.
 *
 * Le texte affiché est exactement le texte copié : les titres de rubrique sont
 * écrits en capitales dans le texte même, et la fiche se contente de les
 * mettre en valeur. Replié par défaut, comme dans la maquette : le compte rendu
 * complet fait une centaine de lignes, et la fiche a d'autres blocs à montrer.
 */
export function MeetingSynthesisSection({
  meetingSynthesis,
  fromAi,
}: {
  meetingSynthesis: string;
  fromAi: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [folded, setFolded] = useState(true);
  const text = meetingSynthesis.trim();
  const canCopy = fromAi && text.length > 0;
  const lines = text.split("\n");
  const foldable = fromAi && lines.length > 14;

  async function copyReport() {
    if (!canCopy) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="border-brand/30 bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-brand/20 bg-brand/5 flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            Compte rendu de visite
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
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
          "relative px-5 pb-4 pt-3",
          foldable && folded && "max-h-80 overflow-hidden",
        )}
      >
        <div className="text-foreground text-[13px] leading-7 break-words whitespace-pre-wrap">
          {lines.map((line, index) =>
            isVisitReportHeading(line) ? (
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
        {foldable && folded ? (
          <div
            aria-hidden
            className="from-card/0 to-card pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b"
          />
        ) : null}
        {!fromAi ? (
          <p className="text-muted-foreground mt-3 text-xs">
            {text.includes("en cours de génération") ||
            text.includes("analyse automatique")
              ? "Le compte rendu complet apparaîtra une fois l'analyse automatique terminée."
              : "Compte rendu indicatif : la version complète est générée après l'analyse."}
          </p>
        ) : null}
      </div>

      {fromAi ? (
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
