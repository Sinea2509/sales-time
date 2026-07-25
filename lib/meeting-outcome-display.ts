import {
  MEETING_OUTCOMES,
  isMeetingOutcome,
  type MeetingOutcome,
} from "@/src/core/domain/meeting-outcome";

/**
 * Le vocabulaire « Résultat » d'un rendez-vous, en un seul endroit.
 *
 * Il en existait quatre exemplaires : le formulaire de création, la fiche
 * contact, les écrans d'administration et deux modules de la bibliothèque. Ils
 * avaient déjà divergé sur deux valeurs. « Suivi » se dessinait en bleu chez
 * l'administrateur et en violet ailleurs ; « Absent » se dessinait en gris chez
 * l'un et en ambre chez l'autre. Un même résultat qui change de couleur d'un
 * écran à l'autre se lit comme un résultat différent.
 *
 * Les couleurs suivent la nature de l'état, pas un ordre d'apparition : vert
 * pour l'issue favorable, rouge pour la perte, ambre pour l'alerte (« Absent »
 * n'est pas un état neutre : c'est un rendez-vous qui n'a pas eu lieu), bleu
 * pour l'information, gris pour ce qui n'est ni l'un ni l'autre.
 *
 * Le violet est rendu au produit : c'est sa couleur d'accent, portée par les
 * boutons et les liens, et un état qui l'emprunte la rend illisible partout
 * ailleurs.
 */
type MeetingOutcomeDisplay = {
  label: string;
  badgeClass: string;
};

const DISPLAY: Record<MeetingOutcome, MeetingOutcomeDisplay> = {
  WON: {
    label: "Gagné",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  LOST: {
    label: "Perdu",
    badgeClass:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
  },
  FOLLOW_UP: {
    label: "Suivi",
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200",
  },
  NO_SHOW: {
    label: "Absent",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
  },
  OTHER: {
    label: "Autre",
    badgeClass:
      "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

/*
  Les écrans d'administration lisent le résultat en base sous forme de chaîne
  libre, sans passer par le type du domaine : la fonction accepte donc une
  chaîne quelconque et retombe sur « Autre » plutôt que d'afficher la valeur
  technique « FOLLOW_UP » à un utilisateur.
*/
function displayFor(outcome: string): MeetingOutcomeDisplay {
  return isMeetingOutcome(outcome) ? DISPLAY[outcome] : DISPLAY.OTHER;
}

export function meetingOutcomeLabel(outcome: string): string {
  return displayFor(outcome).label;
}

export function meetingOutcomeBadgeClass(outcome: string): string {
  return displayFor(outcome).badgeClass;
}

/** Les cinq résultats dans l'ordre du domaine, pour les listes déroulantes. */
export const MEETING_OUTCOME_OPTIONS: ReadonlyArray<{
  value: MeetingOutcome;
  label: string;
}> = MEETING_OUTCOMES.map((value) => ({
  value,
  label: DISPLAY[value].label,
}));
