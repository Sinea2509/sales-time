import {
  meetingOutcomeBadgeClass,
  meetingOutcomeLabel,
} from "@/lib/meeting-outcome-display";
import { cn } from "@/lib/utils";

/**
 * L'insigne « Résultat » d'un rendez-vous, partout sous la même forme.
 *
 * Même raison que pour l'insigne d'étape : quatre écrans le dessinaient chacun
 * de leur côté, et deux couleurs avaient déjà divergé. La forme vit ici, les
 * mots et les couleurs dans `lib/meeting-outcome-display`.
 */
export function MeetingOutcomeBadge({
  outcome,
  className,
}: {
  outcome: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        // `whitespace-nowrap` : un insigne rond coupé en deux lignes cesse
        // d'être rond, et fait grandir sa ligne pendant que ses voisines
        // restent basses.
        "inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meetingOutcomeBadgeClass(outcome),
        className,
      )}
    >
      {meetingOutcomeLabel(outcome)}
    </span>
  );
}
