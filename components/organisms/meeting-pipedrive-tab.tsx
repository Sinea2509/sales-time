"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CopyTextButton } from "@/components/molecules/copy-text-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type { PipedriveBlocks } from "@/src/core/domain/pipedrive-blocks";

type State =
  | { kind: "loading" }
  | { kind: "ready"; blocks: PipedriveBlocks }
  | { kind: "pending" }
  | { kind: "error" };

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function Block({
  title,
  where,
  text,
  note,
}: {
  title: string;
  where: string;
  text: string;
  note?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <p className="text-muted-foreground text-xs">{where}</p>
          </div>
          <CopyTextButton text={text} label="Copier" variant="default" />
        </div>
        {note ? (
          <p className="rounded-lg bg-[#FFB547]/15 px-3 py-2 text-xs text-[#8A5600] dark:text-[#FFD9A0]">
            {note}
          </p>
        ) : null}
        <pre className="bg-muted/50 max-h-80 overflow-auto rounded-xl border border-border/60 p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap dark:border-neutral-800">
          {text}
        </pre>
      </CardContent>
    </Card>
  );
}

/**
 * L'onglet Pipedrive : les trois blocs de la méthode SEED, prêts à coller dans
 * l'affaire et l'organisation. Réservé aux organisations qui ont la
 * fonctionnalité (Sinéa). Les blocs s'écrivent à la première ouverture, puis
 * se relisent sans nouvel appel au modèle.
 */
export function MeetingPipedriveTab({ meetingId }: { meetingId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/meetings/${meetingId}/pipedrive`, {
        method: "POST",
      });
      if (res.status === 409) return setState({ kind: "pending" });
      if (!res.ok) return setState({ kind: "error" });
      setState({
        kind: "ready",
        blocks: (await res.json()) as PipedriveBlocks,
      });
    } catch {
      setState({ kind: "error" });
    }
  }, [meetingId]);

  /*
    Les panneaux de la fiche sont tous rendus, l'onglet inactif est seulement
    caché : le chargement attend que ce panneau devienne visible, pour ne pas
    appeler le modèle à chaque ouverture de fiche.
  */
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        void load();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  return (
    <div ref={root} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={cardTitleClass}>Pour Pipedrive</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Trois blocs à coller dans l&apos;affaire et l&apos;organisation. Ce
            que le rendez-vous n&apos;a pas abordé est marqué « Non abordé ».
          </p>
        </div>
        {state.kind === "ready" && state.blocks.potentialTotal != null ? (
          <p className="rounded-full bg-[#33D1B5]/15 px-3 py-1 text-sm font-semibold text-[#0B6E5C] tabular-nums dark:text-[#9EEEDF]">
            Potentiel {euros.format(state.blocks.potentialTotal)} HT
          </p>
        ) : null}
      </div>

      {state.kind === "loading" ? (
        <Card>
          <CardContent className="text-muted-foreground animate-pulse pt-6 text-sm">
            Lecture du rendez-vous pour Pipedrive… (quelques secondes)
          </CardContent>
        </Card>
      ) : null}

      {state.kind === "pending" ? (
        <Card>
          <CardContent className="text-muted-foreground pt-6 text-sm">
            L&apos;analyse du rendez-vous est en cours : les blocs seront prêts
            juste après.
          </CardContent>
        </Card>
      ) : null}

      {state.kind === "error" ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
            <span className="text-muted-foreground">
              Les blocs n&apos;ont pas pu être écrits cette fois.
            </span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {state.kind === "ready" ? (
        <>
          <Block
            title="Bloc SEED"
            where="Champ « SEED » de l'affaire · à remplacer à chaque rendez-vous"
            text={state.blocks.seed}
          />
          <Block
            title="Carte d'identité"
            where="Description de l'organisation · à mettre à jour si du nouveau"
            text={state.blocks.identity}
          />
          <Block
            title="Projet de formation"
            where="Champ « Projet de Formation » de l'affaire"
            text={state.blocks.trainingProject}
            note={
              state.blocks.trainingProjectIncomplete
                ? "Pas encore assez d'éléments : le bloc liste ce qu'il faut obtenir au prochain rendez-vous."
                : undefined
            }
          />
        </>
      ) : null}
    </div>
  );
}
