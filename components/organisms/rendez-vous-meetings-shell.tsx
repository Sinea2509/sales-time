"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
} from "lucide-react";
import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { MeetingActionBadge } from "@/components/molecules/meeting-action-badge";
import { MeetingEtapeBadge } from "@/components/atoms/meeting-etape-badge";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { RendezVousMeetingRowActions } from "@/components/organisms/rendez-vous-meeting-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import { meetingEtapeDisplayLabel } from "@/lib/meeting-etape-pill";
import { cn } from "@/lib/utils";
import { salesScoreColorClass } from "@/lib/sales-score-color";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  filterMeetingsByTodoCategory,
  meetingsTodoSummary,
  type MeetingActionCategory,
  type MeetingActionInput,
} from "@/src/core/domain/meeting-next-action";

/**
 * Une ligne de la liste des rendez-vous.
 *
 * Elle hérite de `MeetingActionInput` plutôt que de recopier ses champs : la
 * colonne « État » lit l'état réel du rendez-vous, et le compilateur refuse
 * désormais une ligne servie sans de quoi le calculer. `salesScore` en fait
 * partie, il n'est donc plus déclaré ici.
 */
export type RendezVousMeetingRow = MeetingActionInput & {
  id: string;
  prospectName: string;
  prospectCompany: string | null;
  meetingAt: string;
  meetingType: string | null;
  pipelineStage: string | null;
  potentialAmount: number | null;
};

/** Ce que le libellé d'une pastille de filtre annonce, au singulier comme au pluriel. */
const LIBELLE_A_FAIRE: Record<"analyse" | "relance", string> = {
  analyse: "à analyser",
  relance: "à relancer",
};

/**
 * Une des deux natures de geste, en pastille qui filtre la liste.
 *
 * Le résumé « à faire » de l'accueil se contentait de compter, parce qu'il
 * surplombe huit lignes : les trois à analyser se voient. Ici la liste porte
 * jusqu'à deux cents rendez-vous en pages de dix, et un nombre seul envoie
 * chercher page à page. La pastille est donc un bouton, et le compte qu'elle
 * annonce ne bouge pas quand on l'enfonce : il est pris avant le filtre, sans
 * quoi elle effacerait sous elle la raison de la relâcher.
 */
function PastilleAFaire({
  nature,
  compte,
  actif,
  onToggle,
}: {
  nature: "analyse" | "relance";
  compte: number;
  actif: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onToggle}
      title={
        actif
          ? "Filtre actif. Cliquez pour retrouver la liste entière."
          : `N'afficher que les rendez-vous ${LIBELLE_A_FAIRE[nature]}.`
      }
      className={cn(
        "focus-visible:ring-brand/50 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2",
        actif
          ? "border-amber-800 bg-amber-800 text-white hover:bg-amber-900 dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950"
          : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
      )}
    >
      {compte} {LIBELLE_A_FAIRE[nature]}
    </button>
  );
}

const dateShort = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadMeetingsCsv(
  meetings: RendezVousMeetingRow[],
  tamMinutesPerRdv: number,
) {
  const headers = [
    "Prospect",
    "Potentiel (€)",
    "TAM",
    "Date du RDV",
    "Étape",
    "SalesScore",
  ];
  const lines = [
    headers.join(","),
    ...meetings.map((m) =>
      [
        escapeCsvCell(m.prospectName),
        m.potentialAmount != null ? String(m.potentialAmount) : "",
        escapeCsvCell(formatDurationHoursMinutes(tamMinutesPerRdv)),
        escapeCsvCell(dateShort.format(new Date(m.meetingAt))),
        escapeCsvCell(
          meetingEtapeDisplayLabel({
            meetingType: m.meetingType,
            pipelineStage: m.pipelineStage,
          }),
        ),
        m.salesScore != null ? String(m.salesScore) : "",
      ].join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rendez-vous-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 4;

function paginationWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - 1);
  let end = start + MAX_PAGE_BUTTONS - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - MAX_PAGE_BUTTONS + 1;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function RendezVousMeetingsShell({
  meetings,
  tamMinutesPerRdv,
}: {
  meetings: RendezVousMeetingRow[];
  /** Gain estimé par RDV, en minutes, aligné sur le tableau de bord. */
  tamMinutesPerRdv: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [todoFilter, setTodoFilter] = useState<MeetingActionCategory>(null);

  const parRecherche = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings.filter((m) => {
      if (!q) return true;
      if (m.prospectName.toLowerCase().includes(q)) return true;
      if (m.prospectCompany?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [meetings, query]);

  /*
    Le compte se prend après la recherche et avant le filtre d'état : après,
    parce que les deux pastilles doivent parler de la liste qu'on regarde, comme
    l'export ; avant, parce qu'un compteur qui tombe à zéro dès qu'on enfonce
    l'autre pastille retirerait de l'écran la seule chose qui dit combien il
    reste à faire ailleurs.

    Il porte sur toutes les pages du filtre courant, pas sur les dix lignes
    affichées : un « à faire » qui change en tournant la page ne serait plus une
    charge de travail mais un accident d'affichage. Le plafond de chargement de
    la page reste au-dessus, comme pour le reste du tableau.
  */
  const todo = useMemo(() => meetingsTodoSummary(parRecherche), [parRecherche]);

  const filtered = useMemo(
    () => filterMeetingsByTodoCategory(parRecherche, todoFilter),
    [parRecherche, todoFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const setQueryAndResetPage = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  /*
    Enfoncer une pastille ramène à la première page : la page 4 d'une liste de
    deux cents lignes n'existe plus dans une liste de sept, et le tableau se
    serait affiché vide alors que le filtre a bien trouvé de quoi le remplir.
  */
  const toggleTodoFilter = useCallback((nature: "analyse" | "relance") => {
    setTodoFilter((prev) => (prev === nature ? null : nature));
    setPage(1);
  }, []);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, filtered.length);
  const pageNumbers = paginationWindow(currentPage, totalPages);

  const pageIds = pageRows.map((m) => m.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  /*
    Cocher des lignes ne servait à rien : le pied de tableau comptait la
    sélection, et aucun bouton ne s'en servait. L'export est ce que la sélection
    promet ; sans sélection il porte sur ce que la recherche a laissé à l'écran,
    ce qui reste le geste attendu quand on n'a rien coché.

    La sélection est lue sur `meetings` et non sur `filtered` : cocher trois
    lignes puis taper une recherche ne doit pas en effacer deux au passage, et
    le nombre exporté reste alors celui qu'annonce le pied de tableau.
  */
  const rowsToExport = useMemo(
    () =>
      selectedIds.size > 0
        ? meetings.filter((m) => selectedIds.has(m.id))
        : filtered,
    [meetings, filtered, selectedIds],
  );

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const togglePage = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) pageIds.forEach((id) => next.add(id));
      else pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const openMeetingDetail = useCallback(
    (meetingId: string) => {
      router.push(`/company/rendez-vous/${meetingId}`);
    },
    [router],
  );

  const handleRowClick = useCallback(
    (meetingId: string, event: React.MouseEvent<HTMLTableRowElement>) => {
      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea, [role='menu']")) {
        return;
      }
      openMeetingDetail(meetingId);
    },
    [openMeetingDetail],
  );

  const handleRowKeyDown = useCallback(
    (meetingId: string, event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openMeetingDetail(meetingId);
    },
    [openMeetingDetail],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-sm sm:flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              aria-label="Rechercher un prospect"
              placeholder="Rechercher un prospect…"
              value={query}
              onChange={(e) => setQueryAndResetPage(e.target.value)}
              className="h-10 rounded-xl border-border bg-card pl-9 shadow-none dark:border-neutral-800 dark:bg-neutral-950"
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-md border-brand/25 bg-brand/10 text-brand-hover hover:bg-brand/15 dark:text-brand-muted"
            onClick={() => downloadMeetingsCsv(rowsToExport, tamMinutesPerRdv)}
            title={
              selectedIds.size > 0
                ? "Exporte les rendez-vous cochés. Décochez tout pour exporter la liste entière."
                : "Exporte les rendez-vous affichés. Cochez des lignes pour n'exporter que celles-là."
            }
            data-feedback-id="rendez-export-csv"
          >
            <Download className="size-4" />
            {selectedIds.size > 0
              ? `Exporter la sélection (${selectedIds.size})`
              : "Exporter"}
          </Button>
          <BrandCtaLink
            href="/company/rendez-vous/nouveau"
            variant="primary"
            className="h-10 gap-1.5 rounded-md"
            data-feedback-id="rendez-create-new"
          >
            <Plus className="size-4" />
            Analyser un rendez-vous
          </BrandCtaLink>
        </div>
      </div>

      {/*
        Le bandeau « à faire » de l'accueil, mais actionnable : là il annonçait
        la charge, ici il la sort de la liste. Les deux pastilles restent
        affichées quand leur compte est à zéro pour ne pas déplacer celle qui
        reste sous le curseur au moment où l'on vide la sienne.

        Le bouton de retour ne dépend pas des comptes : une recherche peut
        ramener un filtre actif à zéro ligne, et c'est justement là qu'il faut
        pouvoir revenir à la liste entière.
      */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">À faire :</span>
        {todo.aAnalyser === 0 && todo.aRelancer === 0 ? (
          <span className="text-muted-foreground">
            {parRecherche.length === 0
              ? "rien pour l'instant."
              : "ces rendez-vous sont à jour, rien à analyser ni à relancer."}
          </span>
        ) : (
          <>
            <PastilleAFaire
              nature="analyse"
              compte={todo.aAnalyser}
              actif={todoFilter === "analyse"}
              onToggle={() => toggleTodoFilter("analyse")}
            />
            <PastilleAFaire
              nature="relance"
              compte={todo.aRelancer}
              actif={todoFilter === "relance"}
              onToggle={() => toggleTodoFilter("relance")}
            />
          </>
        )}
        {todoFilter == null ? null : (
          <button
            type="button"
            onClick={() => {
              setTodoFilter(null);
              setPage(1);
            }}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-brand/50 rounded-md underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2"
          >
            Voir tous les rendez-vous
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          {/*
            Ces largeurs minimales sont des garde-fous, pas la mise en page :
            elles sont réglées sous ce que le contenu réclame à chaque palier,
            si bien qu'elles ne se déclenchent que sur un écran plus étroit que
            prévu, pour faire défiler plutôt qu'écraser les colonnes.
          */}
          <table className="w-full min-w-[300px] text-left text-sm sm:min-w-[560px] md:min-w-[660px] lg:min-w-[780px]">
            <thead>
              <tr className="border-b border-border bg-muted/80 dark:border-neutral-800 dark:bg-neutral-900/50">
                {/*
                  La case à cocher disparaît sous « sm » : sur téléphone une
                  ligne s'ouvre en la touchant, et une colonne de cases coûterait
                  la largeur que le nom du prospect réclame.
                */}
                <th className="hidden w-12 px-4 py-3.5 sm:table-cell">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner sur cette page"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected;
                    }}
                    onChange={(e) => togglePage(e.target.checked)}
                    className="size-4 cursor-pointer rounded border border-border accent-brand dark:border-neutral-600"
                  />
                </th>
                <DataTableHead className="px-4 py-3.5">Prospect</DataTableHead>
                <DataTableHead className="hidden px-4 py-3.5 text-right md:table-cell">
                  Potentiel
                </DataTableHead>
                {/*
                  Sur téléphone l'intitulé se raccourcit : « Date du RDV »
                  réclame plus de largeur que les dates elles-mêmes, et une
                  colonne dictée par son en-tête vole cette place au nom du
                  prospect, qui est la seule donnée qu'on lise ligne à ligne.
                */}
                <DataTableHead className="px-4 py-3.5">
                  <span className="sm:hidden">Date</span>
                  <span className="hidden sm:inline">Date du RDV</span>
                </DataTableHead>
                {/*
                  « État » dit ce qu'il reste à faire sur le rendez-vous, pas où
                  il en est dans le pipeline : c'est la colonne qui rend la liste
                  actionnable, et elle s'allume avant l'étape parce qu'elle
                  appelle un geste là où l'étape n'est qu'un contexte.

                  L'étape passe de « sm » à « md », largeur où l'accueil
                  l'allume : c'est le même rendez-vous vu deux fois, et une
                  colonne qui apparaît ici et pas là sur le même écran se lit
                  comme une donnée manquante. Elle ne disparaît pas pour autant
                  entre les deux paliers, elle reste sous le nom du prospect.
                */}
                <DataTableHead className="hidden px-4 py-3.5 sm:table-cell">
                  État
                </DataTableHead>
                <DataTableHead className="hidden px-4 py-3.5 md:table-cell">
                  Étape
                </DataTableHead>
                <DataTableHead className="hidden px-4 py-3.5 lg:table-cell">
                  SalesScore
                </DataTableHead>
                <DataTableHead className="w-14 px-2 py-3.5 text-right sm:w-20 sm:px-4">
                  Actions
                </DataTableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-neutral-800">
              {filtered.length === 0 ? (
                /*
                  Trois façons d'arriver sur un tableau vide, trois phrases :
                  aucun rendez-vous du tout, une recherche sans résultat, ou un
                  filtre d'état qui ne trouve rien. Les confondre indiquerait le
                  mauvais geste, et le plus coûteux : effacer sa recherche quand
                  il suffisait de relâcher une pastille.
                */
                <TableEmptyRow
                  colSpan={8}
                  message={
                    meetings.length === 0
                      ? "Aucun rendez-vous enregistré."
                      : todoFilter != null
                        ? `Aucun rendez-vous ${LIBELLE_A_FAIRE[todoFilter]} ici.`
                        : "Aucun résultat pour cette recherche."
                  }
                  description={
                    meetings.length === 0
                      ? "Créez votre premier rendez-vous pour lancer une analyse SONCAS, DISC et KISS : c'est elle qui alimente votre SalesScore et vos statistiques."
                      : todoFilter != null
                        ? "Relâchez la pastille pour retrouver la liste, ou videz la recherche si elle réduit ce que le filtre peut trouver."
                        : `La recherche porte sur le nom du prospect et sur son entreprise. Videz le champ pour retrouver vos ${meetings.length} rendez-vous.`
                  }
                  size="large"
                />
              ) : (
                pageRows.map((m) => {
                  const checked = selectedIds.has(m.id);
                  return (
                    <tr
                      key={m.id}
                      data-state={checked ? "selected" : undefined}
                      tabIndex={0}
                      role="link"
                      aria-label={`Ouvrir le rendez-vous ${m.prospectName}`}
                      onClick={(event) => handleRowClick(m.id, event)}
                      onKeyDown={(event) => handleRowKeyDown(m.id, event)}
                      className="cursor-pointer hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset data-[state=selected]:bg-brand/5 dark:hover:bg-neutral-900/40"
                    >
                      <td className="hidden px-4 py-3.5 align-middle sm:table-cell">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner ${m.prospectName}`}
                          checked={checked}
                          onChange={(e) => toggleRow(m.id, e.target.checked)}
                          className="size-4 cursor-pointer rounded border border-border accent-brand dark:border-neutral-600"
                        />
                      </td>
                      {/*
                        `max-w-0` avec `w-full` donne à cette colonne toute la
                        place que les autres n'ont pas réclamée, au lieu de la
                        laisser s'étendre à la longueur du plus long nom.
                      */}
                      <td className="w-full max-w-0 min-w-[7.5rem] px-4 py-3.5 align-middle sm:min-w-[10.5rem]">
                        <ProspectIdentityCell
                          displayName={m.prospectName}
                          company={m.prospectCompany}
                        />
                        {/*
                          Ce que les colonnes n'affichent pas encore descend
                          sous le nom du prospect, dans la seule cellule qui
                          reste : l'information ne coûte alors que de la hauteur,
                          là où une colonne coûtait de la largeur.

                          Les deux pastilles ne remontent pas au même palier, et
                          elles se cachent donc séparément : sans quoi l'étape
                          s'effacerait à « sm » avec l'état, alors que sa colonne
                          ne s'allume qu'à « md », et un écran de tablette
                          perdrait l'étape des deux côtés à la fois.
                        */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:hidden">
                          <span className="sm:hidden">
                            <MeetingActionBadge
                              meeting={m}
                              href={`/company/rendez-vous/${m.id}`}
                            />
                          </span>
                          <MeetingEtapeBadge
                            meetingType={m.meetingType}
                            pipelineStage={m.pipelineStage}
                          />
                        </div>
                      </td>
                      <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3.5 text-right align-middle tabular-nums md:table-cell">
                        {formatPotentialEuro(m.potentialAmount)}
                      </td>
                      <td className="text-muted-foreground whitespace-nowrap px-4 py-3.5 align-middle tabular-nums">
                        {dateShort.format(new Date(m.meetingAt))}
                      </td>
                      <td className="hidden px-4 py-3.5 align-middle sm:table-cell">
                        <MeetingActionBadge
                          meeting={m}
                          href={`/company/rendez-vous/${m.id}`}
                        />
                      </td>
                      <td className="hidden px-4 py-3.5 align-middle md:table-cell">
                        <MeetingEtapeBadge
                          meetingType={m.meetingType}
                          pipelineStage={m.pipelineStage}
                        />
                      </td>
                      <td className="hidden px-4 py-3.5 align-middle lg:table-cell">
                        {m.salesScore != null ? (
                          <span
                            className={cn(
                              "text-base font-semibold tabular-nums",
                              salesScoreColorClass(m.salesScore),
                            )}
                          >
                            {m.salesScore}
                          </span>
                        ) : (
                          <span
                            className="text-muted-foreground"
                            title="Non calculable : ce rendez-vous n'a pas encore d'analyse SONCAS."
                          >
                            {VALEUR_NON_CALCULABLE}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3.5 text-right align-middle sm:px-4">
                        <RendezVousMeetingRowActions
                          meetingId={m.id}
                          prospectName={m.prospectName}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/*
          Rien à parcourir, donc pas de barre de parcours : « Affichage de 0 à 0
          sur 0 entrée » au-dessus d'un bouton « page 1 » qui ne mène nulle part
          décrit un tableau vide avec plus de mots que la ligne vide, qui le dit
          déjà et dit en plus quoi faire.
        */}
        {filtered.length === 0 ? null : (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
            <p className="text-muted-foreground text-sm">
              Affichage de{" "}
              <span className="text-foreground font-medium">{rangeStart}</span>{" "}
              à <span className="text-foreground font-medium">{rangeEnd}</span>{" "}
              sur{" "}
              <span className="text-foreground font-medium">
                {filtered.length}
              </span>{" "}
              entrée{filtered.length > 1 ? "s" : ""}
              {selectedIds.size > 0 ? (
                <span className="text-muted-foreground ml-2">
                  ·{" "}
                  <span className="text-foreground font-medium">
                    {selectedIds.size}
                  </span>{" "}
                  sélectionné{selectedIds.size > 1 ? "s" : ""}
                </span>
              ) : null}
            </p>
            {/*
            Une seule page ne se parcourt pas : le bouton « 1 » y est allumé sur
            la page où l'on se trouve déjà, entre deux flèches éteintes. Le
            compteur de gauche suffit alors à dire ce que le tableau contient.
          */}
            {totalPages <= 1 ? null : (
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                  className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:disabled:hover:bg-neutral-950"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {pageNumbers.map((n) => {
                  const isActive = n === currentPage;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-md border text-sm font-medium tabular-nums transition-colors",
                        isActive
                          ? "border-brand bg-brand text-brand-foreground hover:bg-brand-hover"
                          : "text-muted-foreground hover:text-foreground border-border bg-card hover:bg-muted dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                      )}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                  className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 dark:disabled:hover:bg-neutral-950"
                >
                  <ChevronRight className="size-4" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
