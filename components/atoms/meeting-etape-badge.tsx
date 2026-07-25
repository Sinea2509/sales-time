import {
  ETAPE_NON_RENSEIGNEE,
  meetingEtapeDisplayLabel,
  meetingEtapePillClass,
  type MeetingEtapeSource,
} from "@/lib/meeting-etape-pill";
import { cn } from "@/lib/utils";

/**
 * L'insigne « Étape » d'un rendez-vous, partout sous la même forme.
 *
 * Trois écrans le dessinaient chacun de leur côté avec la même chaîne de
 * classes recopiée. Une couleur d'étape qui diffère d'un écran à l'autre se
 * lit comme une étape différente : c'est le genre d'écart qu'une copie finit
 * toujours par produire, et qu'un composant unique rend impossible.
 */
export function MeetingEtapeBadge({
  meetingType,
  pipelineStage,
  className,
}: MeetingEtapeSource & { className?: string }) {
  const label = meetingEtapeDisplayLabel({ meetingType, pipelineStage });
  const nonRenseignee = label === ETAPE_NON_RENSEIGNEE;

  return (
    <span
      className={cn(
        // `whitespace-nowrap` : un insigne rond coupé en deux lignes cesse
        // d'être rond, et sa ligne de tableau grandit pendant que ses voisines
        // restent basses. Une étiquette d'étape tient sur une ligne, ou la
        // colonne s'élargit pour elle.
        "inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meetingEtapePillClass({ meetingType, pipelineStage }),
        className,
      )}
      title={
        nonRenseignee
          ? "Ce rendez-vous ne porte ni type ni étape de pipeline. Renseignez-le pour le retrouver dans les analyses par étape."
          : undefined
      }
    >
      {label}
    </span>
  );
}
