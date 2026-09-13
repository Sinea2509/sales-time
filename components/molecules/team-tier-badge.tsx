import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  tierRangeLabel,
  type RankingTier,
  type RankingTierId,
} from "@/src/core/domain/team-ranking";

/**
 * Les paliers sont une grandeur ordonnée, donc leur couleur l'est aussi : une
 * seule teinte, du clair au foncé, plutôt que quatre teintes concurrentes qui
 * feraient croire à quatre catégories sans ordre.
 *
 * Les quatre marches sont espacées régulièrement en clarté perçue (OKLCH 0,943 ·
 * 0,702 · 0,491 · 0,283 en thème clair) et non prises au hasard dans la rampe :
 * l'écart de contraste entre deux marches voisines vaut 2,40 · 2,56 · 2,10, si
 * bien qu'aucune paire ne se confond. Le thème sombre reprend la même progression
 * en miroir, du plus sombre au plus clair, mesurée sur le fond zinc-900 : 1,67 ·
 * 1,56 · 2,06.
 *
 * Chaque encre a été calculée sur son fond, pas choisie à l'œil : 7,71 · 5,36 ·
 * 7,29 · 15,28 en clair, 8,21 · 7,71 · 5,88 · 5,36 en sombre, toutes au-dessus du
 * seuil AA de 4,5.
 *
 * Enfin le nom du palier est toujours écrit à côté, si bien que la couleur
 * renforce l'ordre sans jamais porter seule l'information.
 *
 * Exporté parce que la piste de répartition peint ses pastilles avec ces mêmes
 * quatre marches : le manager y reconnaît d'un coup d'œil les paliers qu'il lit
 * une ligne plus bas dans le tableau. Une seconde échelle recopiée à côté
 * finirait par en dériver, et deux violets voisins qui ne veulent pas dire la
 * même chose sur le même écran, c'est pire que pas de couleur du tout.
 */
export const TEAM_TIER_CLASS: Record<RankingTierId, string> = {
  demarrage:
    "bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
  progression:
    "bg-violet-400 text-violet-950 ring-violet-500 dark:bg-violet-800 dark:text-violet-100 dark:ring-violet-700",
  maitrise:
    "bg-violet-700 text-white ring-violet-800 dark:bg-violet-600 dark:text-white dark:ring-violet-500",
  excellence:
    "bg-violet-950 text-white ring-violet-800 dark:bg-violet-400 dark:text-violet-950 dark:ring-violet-300",
};

const CHIP_BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap";

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
          "bg-muted text-foreground ring-border dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
          className,
        )}
        title={
          unavailableTitle ??
          "Palier non décerné : ce membre n'est pas au classement."
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
      {tier.nom}
    </span>
  );
}
