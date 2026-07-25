import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { cn } from "@/lib/utils";
import { RANKING_TIERS, tierRangeLabel } from "@/src/core/domain/team-ranking";

/**
 * Légende des paliers : les quatre insignes avec leur tranche de notes.
 *
 * Un palier sans échelle est un mot. « Maîtrise » ne dit rien tant que le
 * lecteur ignore où commence « Excellence », et il ne le devinera pas d'un
 * dégradé de violets. La légende est donc obligatoire partout où un palier est
 * affiché seul : le tableau d'équipe la porte dans son bandeau, la fiche du
 * commercial la porte dans sa carte de position.
 *
 * Elle est définie ici une seule fois pour que ces écrans ne puissent pas
 * afficher deux échelles différentes le jour où les bornes changeront.
 */
export function TeamTierLegend({
  className,
  label = "Paliers :",
}: {
  className?: string;
  /** Intitulé qui précède les insignes. `null` pour n'afficher que les insignes. */
  label?: string | null;
}) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1.5", className)}
    >
      {label ? (
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      ) : null}
      <ul
        className="flex flex-wrap items-center gap-1.5"
        aria-label="Paliers de note"
      >
        {RANKING_TIERS.map((tier) => (
          <li key={tier.id} title={tierRangeLabel(tier)}>
            <TeamTierBadge tier={tier} />
          </li>
        ))}
      </ul>
    </div>
  );
}
