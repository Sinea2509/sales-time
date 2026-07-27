import Link from "next/link";
import { MeetingOutcomeBadge } from "@/components/atoms/meeting-outcome-badge";
import { formatPotentialEuro } from "@/lib/format-potential-euro";
import { meetingOutcomeLabel } from "@/lib/meeting-outcome-display";
import {
  salesScoreBarClass,
  salesScoreColorClass,
} from "@/lib/sales-score-color";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import type { MeetingOutcome } from "@/src/core/domain/meeting-outcome";

export type AnalysePriorityOpportunityRow = {
  id: string;
  prospectName: string;
  potentialAmount: number;
  salesScore: number | null;
  outcome: MeetingOutcome;
};

export const TOP_OPPORTUNITIES = 10;

const SCORE_MAX = 100;
const SCORE_ABSENT_TITRE =
  "SalesScore non calculable : ce rendez-vous n'a pas encore été analysé.";

function clampScore(score: number | null): number | null {
  if (score == null) return null;
  return Math.min(SCORE_MAX, Math.max(0, Math.round(score)));
}

/*
  La liste est déjà triée par montant décroissant, et le montant est écrit en
  toutes lettres sur chaque ligne. Une barre qui redessinerait ce montant ne
  ferait que répéter l'ordre de tri sous forme d'escalier.

  La barre porte donc le SalesScore, c'est-à-dire la seule grandeur de la ligne
  que le texte seul ne rend pas comparable d'une ligne à l'autre, et la seule
  dont la mauvaise lecture coûte une action : un gros montant mené avec un
  mauvais score est exactement le rendez-vous qu'il faut retravailler.

  La largeur vaut le score, sans plancher. L'ancienne version écrivait
  `Math.max(score, 12)` : un score de 0, de 5 et de 12 y dessinaient la même
  barre, et le lecteur ne pouvait plus les distinguer.
*/
function OpportunityRow({
  rank,
  row,
}: {
  rank: number;
  row: AnalysePriorityOpportunityRow;
}) {
  const score = clampScore(row.salesScore);
  const amount = formatPotentialEuro(row.potentialAmount);
  const outcome = meetingOutcomeLabel(row.outcome);
  const scorePhrase =
    score != null
      ? `SalesScore ${score} sur ${SCORE_MAX}`
      : "SalesScore non calculable";

  return (
    <li>
      <Link
        href={`/company/rendez-vous/${row.id}`}
        aria-label={`${row.prospectName}, potentiel ${amount}, ${scorePhrase}, résultat ${outcome}.`}
        className="focus-visible:ring-brand/70 flex flex-col gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-neutral-800/60"
      >
        <span className="flex items-baseline gap-2">
          <span className="text-muted-foreground w-5 shrink-0 text-right text-xs font-medium tabular-nums">
            {rank}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {row.prospectName}
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {amount}
          </span>
        </span>

        {/*
          `pl-7` aligne la barre sous le nom : 20 px de rang plus 8 px
          d'écart. La piste est décorative, le nombre qui la suit porte la
          valeur exacte.
        */}
        <span className="flex items-center gap-2 pl-7">
          {/*
            Sans score, pas de piste. Une piste grise vide se lit comme un
            score mesuré à zéro : le rendez-vous non analysé et le rendez-vous
            noté 0 dessinaient exactement la même barre. L'espace est conservé
            pour que les lignes restent alignées, mais rien n'y est peint.
          */}
          {score != null ? (
            <span
              className="block h-2 min-w-0 flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800"
              aria-hidden
            >
              {/*
                La barre et le chiffre prennent le ton du score, celui du
                tableau des rendez-vous : une barre de marque sous un 47 rouge
                racontait deux histoires, et le violet signe les actions, pas
                les données.
              */}
              <span
                className={`block h-full rounded-full ${salesScoreBarClass(score)}`}
                style={{ width: `${score}%` }}
              />
            </span>
          ) : (
            <span className="block h-2 min-w-0 flex-1" aria-hidden />
          )}
          {score != null ? (
            <span
              className={`w-10 shrink-0 text-right text-xs font-semibold tabular-nums ${salesScoreColorClass(score)}`}
            >
              {score}
            </span>
          ) : (
            <span
              className="text-muted-foreground w-10 shrink-0 text-right text-xs"
              title={SCORE_ABSENT_TITRE}
            >
              {VALEUR_NON_CALCULABLE}
            </span>
          )}
          {/*
            Largeur fixe : « Absent » est plus large que « Suivi », et un
            badge de largeur variable rognait la piste d'autant. Les pistes
            mesuraient de 362 à 375 px sur un même écran, si bien qu'un score
            de 96 pouvait dessiner une barre plus longue qu'un score de 100.
            Une barre ne se compare d'une ligne à l'autre que si toutes les
            lignes partagent la même règle.
          */}
          <span className="flex w-18 shrink-0 justify-end">
            <MeetingOutcomeBadge outcome={row.outcome} />
          </span>
        </span>
      </Link>
    </li>
  );
}

export function AnalysePriorityOpportunitiesTable({
  rows,
}: {
  rows: AnalysePriorityOpportunityRow[];
}) {
  const displayRows = rows.slice(0, TOP_OPPORTUNITIES);

  /*
    L'état vide dessinait dix lignes numérotées de 1 à 10, vides, derrière une
    phrase. Un classement fantôme se lit comme un classement en cours de
    chargement, ou comme dix rendez-vous dont on aurait perdu les noms. Une
    seule phrase, qui nomme le champ à remplir, dit la vérité et donne l'action.
  */
  if (displayRows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-muted-foreground max-w-xs text-center text-sm text-balance">
          Aucun rendez-vous avec un montant potentiel sur la période. Renseignez
          le champ « Montant potentiel (€) » en créant un rendez-vous : vos plus
          grosses opportunités apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <ol className="-mx-2 space-y-0.5">
      {displayRows.map((row, index) => (
        <OpportunityRow key={row.id} rank={index + 1} row={row} />
      ))}
    </ol>
  );
}
