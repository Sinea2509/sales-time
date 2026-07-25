"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cardProseBodyClass, sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

export function MeetingSynthesisSection({
  meetingSynthesis,
  fromAi,
}: {
  meetingSynthesis: string;
  fromAi: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = fromAi && meetingSynthesis.trim().length > 0;

  const copyReport = useCallback(async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(meetingSynthesis.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [canCopy, meetingSynthesis]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className={sectionHeadingClass}>Compte-rendu du rdv</h2>
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
          <p className="leading-relaxed whitespace-pre-wrap">
            {meetingSynthesis}
          </p>
          {!fromAi ? (
            <p className="text-muted-foreground mt-3 text-xs">
              {meetingSynthesis.includes("en cours de génération")
                ? "Le compte-rendu complet apparaîtra une fois l'analyse automatique terminée."
                : meetingSynthesis.includes("analyse automatique")
                  ? "Le compte-rendu complet apparaîtra une fois l'analyse automatique terminée."
                  : "Compte-rendu indicatif : une version enrichie est générée après analyse."}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
