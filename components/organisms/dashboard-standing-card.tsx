import { TeamMemberStanding } from "@/components/molecules/team-member-standing";
import { TeamTierLegend } from "@/components/molecules/team-tier-legend";
import { cn } from "@/lib/utils";
import type { TeamMemberStanding as TeamMemberStandingData } from "@/src/core/application/get-org-admin-dashboard";

/**
 * Ma position dans l'équipe, sur le tableau de bord du commercial.
 *
 * Jusqu'ici le manager voyait une place, un palier, une note et un écart, et le
 * commercial ne voyait rien de tout cela sur son propre écran : il était le seul
 * de l'application à ignorer ce qu'on lui disait. Les deux écrans appellent
 * désormais la même fonction sur le même périmètre d'équipe, si bien qu'ils ne
 * peuvent pas annoncer deux places différentes pour la même personne.
 *
 * Rien n'est révélé des autres : la carte ne porte que la ligne du commercial,
 * la moyenne d'équipe et des effectifs. Aucun nom, aucune note d'un collègue
 * n'atteint le navigateur.
 *
 * La légende accompagne toujours le palier. Un palier sans échelle est un mot,
 * et « Maîtrise » ne dit rien tant qu'on ignore où commence « Excellence ».
 */
export function DashboardStandingCard({
  standing,
  className,
}: {
  standing: TeamMemberStandingData;
  className?: string;
}) {
  // Hors de l'équipe cadrée, il n'y a pas de place à annoncer. Mieux vaut ne
  // rien dire qu'un rang calculé sur un groupe auquel on n'appartient pas.
  if (!standing.row) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-6 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
      data-feedback-id="dashboard-standing"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          Ma position dans l&apos;équipe
        </span>
        <TeamMemberStanding standing={standing} />
      </div>
      <TeamTierLegend className="sm:shrink-0 sm:justify-end" />
    </div>
  );
}
