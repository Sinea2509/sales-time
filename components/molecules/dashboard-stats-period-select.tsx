"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  areAllStatsWindowsDisabled,
  MIN_RDV_FOR_STATS,
  STATS_WINDOW_DAYS_OPTIONS,
  type StatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";

const LABELS: Record<StatsWindowDays, string> = {
  7: "7 jours",
  30: "30 jours",
  90: "90 jours",
};

export function DashboardStatsPeriodSelect(props: {
  value: StatsWindowDays;
  /** Fenêtres sans assez de RDV : options grisées dans le sélecteur. */
  disabledDays?: StatsWindowDays[];
}) {
  const disabledDays = props.disabledDays ?? [];
  const disabledSet = new Set(disabledDays);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  /*
    Sur un compte jeune, aucune fenêtre n'atteint le seuil : les trois options
    étaient grisées, chacune suivie du même « (données insuffisantes) », et
    l'option affichée était elle-même désactivée. Le commercial ouvrait une
    liste dans laquelle rien ne pouvait être choisi, sans jamais apprendre ce
    qu'il fallait pour l'ouvrir.

    Un sélecteur qui n'offre aucun choix n'est plus un sélecteur : la période en
    vigueur s'écrit alors en toutes lettres, avec la règle qui la fige.
  */
  if (areAllStatsWindowsDisabled(disabledDays)) {
    return (
      <div className="text-sm text-muted-foreground sm:max-w-[17rem] sm:text-right">
        <p className="text-foreground">
          <span className="sr-only">Période des statistiques : </span>
          {LABELS[props.value]}
        </p>
        <p className="mt-0.5 text-xs text-pretty">
          Choisir la période demande au moins {MIN_RDV_FOR_STATS} RDV
          enregistrés.
        </p>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center text-sm whitespace-nowrap text-muted-foreground">
      {/*
        « outline-none » sans rien en échange rendait cette commande muette au
        clavier : on tabulait dessus et rien ne bougeait à l'écran. C'est
        pourtant elle qui commande la période de tous les chiffres de la page.

        Un anneau plein plutôt que la bordure teintée des champs bordés : ce
        sélecteur n'a aucune bordure à repeindre, et lui en poser une
        déplacerait le chevron de deux pixels au repos. La marque à pleine
        force, et non voilée, parce qu'elle se détache sur le blanc de la page
        (rapport 5,1) là où la même teinte à 30 % tomberait à 2,3.
      */}
      <select
        aria-label="Période des statistiques (jours glissants)"
        className="h-8 appearance-none rounded-md bg-transparent pr-5 pl-1 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
        value={String(props.value)}
        disabled={pending}
        onChange={(e) => {
          const jours = e.target.value;
          const next = new URLSearchParams(searchParams.toString());
          next.set("jours", jours);
          startTransition(() => {
            router.replace(`${pathname}?${next.toString()}`);
          });
        }}
      >
        {STATS_WINDOW_DAYS_OPTIONS.map((d) => (
          <option key={d} value={String(d)} disabled={disabledSet.has(d)}>
            {LABELS[d]}
            {/*
              « données insuffisantes » énonçait le verdict du système. Le fait
              qui le produit se lit mieux, et se vérifie : cette fenêtre compte
              moins de RDV que le seuil.
            */}
            {disabledSet.has(d) ? ` (moins de ${MIN_RDV_FOR_STATS} RDV)` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 size-4 text-muted-foreground" />
    </div>
  );
}
