import { Medal } from "@/components/atoms/medal";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  tierRangeLabel,
  type RankingTier,
  type RankingTierId,
} from "@/src/core/domain/team-ranking";

/**
 * La couleur de chaque médaille, du bronze au diamant : un fond pâle du métal
 * et une encre sombre de la même teinte, lisible au seuil AA. Le nom de la
 * médaille et son dessin sont toujours à côté : la couleur renforce, elle ne
 * porte jamais seule l'information.
 *
 * Exporté parce que la piste de répartition peint ses pastilles avec ces mêmes
 * couleurs : le manager y reconnaît d'un coup d'œil les médailles qu'il lit une
 * ligne plus bas dans le tableau.
 *
 * Décision de Thomas du 23 octobre 2026 : les paliers deviennent des médailles,
 * et la rampe de violets laisse place aux métaux.
 */
export const TEAM_TIER_CLASS: Record<RankingTierId, string> = {
  demarrage:
    "bg-[#F6E1CF] text-[#6B3A17] ring-[#D9A27A] dark:bg-[#3A2416] dark:text-[#F3C9A7] dark:ring-[#7E4A28]",
  progression:
    "bg-[#ECEFF4] text-[#3D4557] ring-[#B6BECC] dark:bg-[#272B34] dark:text-[#D8DDE6] dark:ring-[#5B6476]",
  maitrise:
    "bg-[#FFF0C2] text-[#6B4A00] ring-[#E8BE4F] dark:bg-[#3A2C08] dark:text-[#FFDD84] dark:ring-[#8A6512]",
  excellence:
    "bg-[#E4F6FD] text-[#3A21A8] ring-[#9FD8F0] dark:bg-[#1E1A3D] dark:text-[#C9EEFC] dark:ring-[#5B3DF5]",
};

const CHIP_BASE =
  "inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1 text-xs font-semibold ring-1 ring-inset whitespace-nowrap";

export function TeamTierBadge({
  tier,
  unavailableTitle,
  className,
}: {
  tier: RankingTier | null;
  /**
   * Pourquoi aucun palier n'est décerné. Une case vide sans explication laisse
   * le lecteur conclure ce qu'il veut, en général le pire.
   */
  unavailableTitle?: string;
  className?: string;
}) {
  if (!tier) {
    return (
      <span
        className={cn(
          CHIP_BASE,
          "bg-muted text-foreground ring-border pl-2 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
          className,
        )}
        title={
          unavailableTitle ??
          "Médaille non décernée : ce membre n'est pas au classement."
        }
      >
        {VALEUR_NON_CALCULABLE}
      </span>
    );
  }

  return (
    <span
      className={cn(CHIP_BASE, TEAM_TIER_CLASS[tier.id], className)}
      title={tierRangeLabel(tier)}
    >
      <Medal tier={tier.id} size="xs" />
      {tier.nom}
    </span>
  );
}
