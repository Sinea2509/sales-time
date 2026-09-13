import { TeamMemberStanding } from "@/components/molecules/team-member-standing";
import { TeamTierLegend } from "@/components/molecules/team-tier-legend";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import { cn } from "@/lib/utils";
import type { TeamMemberStanding as TeamMemberStandingData } from "@/src/core/application/get-org-admin-dashboard";

/**
 * La ligne qui désigne le groupe, sous le titre qui le nomme.
 *
 * Trois cas, et le troisième n'est pas une précaution de style. Un manager
 * retiré de l'organisation laisse le rattachement de ses commerciaux intact :
 * `removeMemberAction` efface l'adhésion, pas le lien. Leur rang reste donc
 * cadré sur son équipe alors que son nom, lui, ne se trouve plus. Écrire
 * « Aucun manager déclaré » dans ce cas serait faux, et « Équipe de » suivi de
 * rien serait pire.
 *
 * Exportée pour être interrogée par un test sans rendre la carte, comme
 * `listeDesSatellites` l'est dans « team-ranking-summary.tsx ». Aucun autre
 * fichier ne l'appelle.
 */
export function sousTitreDuGroupe(
  comparisonGroup: TeamScopeGroup,
  managerNameLine: string | null,
): { texte: string; title?: string } {
  if (comparisonGroup === "organization") {
    return {
      texte: "Aucun manager déclaré",
      title:
        "Sans manager renseigné, la place se mesure sur l'organisation entière. Un rattachement la ramènerait à une équipe.",
    };
  }
  if (!managerNameLine) {
    return {
      texte: "Manager hors de l'organisation",
      title:
        "Le manager auquel vous êtes rattaché n'est pas membre de cette organisation. La place se mesure quand même sur les commerciaux qui lui sont rattachés.",
    };
  }
  return { texte: `Équipe de ${managerNameLine}` };
}

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
 *
 * Le titre nomme le groupe sur lequel la place se mesure, parce que ce groupe
 * change. Quand un manager est déclaré, le rang se calcule sur son équipe, et
 * l'équipe se désigne par son nom : « 3e sur 7 » demandait sinon « sept qui ? ».
 * Quand aucun manager ne l'est, `resolveSellerTeamUserIds` ne rend aucun
 * cadrage et le rang porte alors sur l'organisation entière ; annoncer une
 * « équipe » serait dans ce cas un mot pour un groupe qui n'existe pas.
 *
 * Ce titre suit le cadrage et non le nom : ce sont deux questions, et elles
 * n'ont pas toujours la même réponse. Un rang peut être cadré sur une équipe
 * dont le manager a quitté l'organisation, donc sans nom à afficher, et le
 * déduire du nom aurait renvoyé ce lecteur à « l'organisation » alors qu'il
 * était classé parmi sept.
 */
export function DashboardStandingCard({
  standing,
  comparisonGroup = "team",
  managerNameLine = null,
  className,
}: {
  standing: TeamMemberStandingData;
  /** Groupe sur lequel le rang a été calculé, tel que `teamScopeGroup` le nomme. */
  comparisonGroup?: TeamScopeGroup;
  /** Nom du manager qui donne son périmètre au rang. `null` s'il n'y en a pas. */
  managerNameLine?: string | null;
  className?: string;
}) {
  // Hors de l'équipe cadrée, il n'y a pas de place à annoncer. Mieux vaut ne
  // rien dire qu'un rang calculé sur un groupe auquel on n'appartient pas.
  if (!standing.row) return null;

  const sousTitre = sousTitreDuGroupe(comparisonGroup, managerNameLine);

  return (
    <div
      className={cn(
        "relative isolate flex flex-col gap-3 overflow-hidden rounded-2xl border border-brand/15 bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
      data-feedback-id="dashboard-standing"
    >
      {/*
        Un halo de marque, la seule touche de couleur du bloc : il fait de cette
        carte le point d'entrée de l'écran, sans peser comme un aplat. Décoratif
        et annoncé comme tel ; posé derrière le contenu, il ne mange aucun
        contraste, l'encre restant sur le blanc que le halo effleure à peine.
      */}
      <span
        aria-hidden
        className="bg-brand/10 dark:bg-brand/20 pointer-events-none absolute -top-20 -right-12 -z-10 size-44 rounded-full blur-3xl"
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase dark:text-zinc-400">
            {comparisonGroup === "team"
              ? "Ma position dans l'équipe"
              : "Ma position dans l'organisation"}
          </span>
          <span
            className="truncate text-xs leading-snug text-muted-foreground dark:text-zinc-400"
            title={sousTitre.title}
          >
            {sousTitre.texte}
          </span>
        </div>
        {/* Le commercial lit son SalesScore sur 100 ; la note sur 5 est au manager. */}
        <TeamMemberStanding
          standing={standing}
          comparisonGroup={comparisonGroup}
          echelle="sur100"
        />
      </div>
      <TeamTierLegend className="sm:shrink-0 sm:justify-end" />
    </div>
  );
}
