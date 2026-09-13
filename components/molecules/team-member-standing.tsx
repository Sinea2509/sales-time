import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { membresClasses, rdvNotes } from "@/lib/accord-fr";
import type { TeamScopeGroup } from "@/lib/team-seller-scope";
import { cn } from "@/lib/utils";
import { formatNoteOn5 } from "@/lib/format-note-on5";
import {
  formatEcartSur100,
  formatScoreSur100,
  type EchelleDeNote,
} from "@/lib/format-score-sur100";
import {
  formatDeltaOn5,
  formatNoteFr,
  rankLabel,
  unrankedExplanation,
} from "@/src/core/domain/team-ranking";
import type { TeamMemberStanding as TeamMemberStandingData } from "@/src/core/application/get-org-admin-dashboard";

/**
 * Comment nommer le groupe auquel cette place compare, selon le cadrage.
 *
 * Presque toujours l'équipe, et c'est le défaut. Mais un rang que rien n'a
 * cadré se mesure sur l'organisation entière : c'est le cas du commercial dont
 * aucun manager n'est déclaré, et celui du manager qui n'a encore personne de
 * rattaché. Leur écrire « moyenne d'équipe » leur fait compter une équipe de
 * quarante, et contredit le titre affiché juste au-dessus.
 *
 * Les deux libellés sont écrits en entier plutôt qu'assemblés autour d'un nom
 * variable : « la moyenne d'équipe » s'élide, « la moyenne de l'organisation »
 * non, et une règle d'élision codée à la main se serait trompée au premier
 * groupe commençant par une consonne.
 */
const GROUPE = {
  team: { moyenne: "la moyenne d'équipe", parmi: "de l'équipe" },
  organization: {
    moyenne: "la moyenne de l'organisation",
    parmi: "de l'organisation",
  },
} as const;

/**
 * Phrase de comparaison à la moyenne du groupe.
 *
 * En français « point » ne prend la marque du pluriel qu'à partir de deux :
 * « 1,4 point », « 2 points ». La phrase se construit donc en entier ici plutôt
 * qu'en collant des morceaux dans le rendu, où l'accord passerait inaperçu.
 */
function phraseEcart(
  ecart: number,
  moyenne: number,
  rankedCount: number,
  groupe: TeamScopeGroup,
  echelle: EchelleDeNote,
) {
  const moyenneAffichee =
    echelle === "sur5"
      ? `${formatNoteFr(moyenne)}/5`
      : formatScoreSur100(moyenne);
  const reference = `${GROUPE[groupe].moyenne} (${moyenneAffichee}, calculée sur ${membresClasses(
    rankedCount,
  )}).`;
  if (ecart === 0) return `Exactement à ${reference}`;
  const unite = Math.abs(ecart) >= 2 ? "points" : "point";
  const ecartAffiche =
    echelle === "sur5" ? formatDeltaOn5(ecart) : formatEcartSur100(ecart);
  return `${ecartAffiche} ${unite} par rapport à ${reference}`;
}

/**
 * Note du commercial, avec le nombre de rendez-vous dont elle est la moyenne.
 *
 * Le suffixe dit « moyenne de 8 RDV notés » et non « sur 8 RDV notés » : la même
 * ligne annonce déjà « 1re place sur 7 », où « sur » veut dire « parmi ». Deux
 * sens du même mot à trois mots d'intervalle, et le lecteur croit lire 4,3 sur 8.
 */
function NoteAvecBase({
  note,
  score,
  scored,
  echelle,
}: {
  /** La note sur 5, celle du manager. */
  note: number | null;
  /** Le même chiffre sur 100, celui du commercial. */
  score: number | null;
  scored: number;
  echelle: EchelleDeNote;
}) {
  return (
    <span
      className="text-xs font-medium text-foreground tabular-nums dark:text-zinc-300"
      title={
        echelle === "sur5"
          ? `Moyenne des SalesScores des ${rdvNotes(scored)} de la période, ramenée sur 5.`
          : `Moyenne des SalesScores des ${rdvNotes(scored)} de la période.`
      }
    >
      {echelle === "sur5" ? formatNoteOn5(note) : formatScoreSur100(score)}
      <span className="font-normal text-muted-foreground dark:text-zinc-400">
        {" "}
        · moyenne de {rdvNotes(scored)}
      </span>
    </span>
  );
}

/**
 * Rappel de la position d'un commercial sur sa fiche.
 *
 * Le manager arrive ici depuis un tableau qui vient d'annoncer une place, un
 * palier et une note. Une fiche qui n'en dit rien lui fait perdre le fil au
 * moment précis où il cherche quoi en faire. Les trois informations sont donc
 * reprises telles quelles, calculées par la même fonction que le tableau, si
 * bien qu'elles ne peuvent pas diverger.
 *
 * Hors classement, la fiche écrit la phrase entière au lieu de la cacher dans
 * une infobulle : c'est ici que se décide l'action, et l'action n'est pas la
 * même selon qu'il manque des analyses ou seulement du volume. Elle affiche
 * aussi la note, faute de quoi la phrase « le score reste affiché » désignerait
 * une colonne voisine qui n'existe que dans le tableau.
 */
export function TeamMemberStanding({
  standing,
  comparisonGroup,
  echelle,
  className,
}: {
  standing: TeamMemberStandingData;
  /**
   * Groupe auquel la place compare, tel que `teamScopeGroup` le nomme.
   *
   * Exigé, sans valeur par défaut : « équipe » est le cas courant, et un
   * défaut aurait laissé le mot juste par habitude sur les écrans où il est
   * faux. Le compilateur oblige donc chaque écran qui affiche une place à dire
   * sur quel groupe il l'a calculée.
   */
  comparisonGroup: TeamScopeGroup;
  /**
   * Sur 5 pour le manager, sur 100 pour le commercial.
   *
   * Exigée, sans défaut, pour la même raison que le groupe : chaque écran qui
   * affiche une note doit dire à qui il parle, faute de quoi la note sur 5
   * reviendrait sur l'écran du commercial par simple oubli.
   */
  echelle: EchelleDeNote;
  className?: string;
}) {
  const row = standing.row;
  if (!row) return null;

  const { ranking } = standing;
  const moyenne =
    echelle === "sur5" ? ranking.averageNoteOn5 : standing.averageSalesScore;

  // Les deux branches partagent le même conteneur : l'appelant règle l'alignement
  // une seule fois, et il vaut aussi bien pour le rang que pour son absence.
  if (row.rank == null) {
    const sansNote = row.scoredMeetings === 0;
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {/* Sans aucune note il n'y a rien à montrer : la phrase le dit déjà. */}
        {sansNote ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <TeamTierBadge
              tier={null}
              unavailableTitle={unrankedExplanation(
                row.unrankedReason ?? "volume-insuffisant",
                row.scoredMeetings,
                ranking.minScoredMeetings,
              )}
            />
            <NoteAvecBase
              note={row.noteGlobaleOn5}
              score={row.salesScoreAvg}
              scored={row.scoredMeetings}
              echelle={echelle}
            />
          </div>
        )}
        <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
          <span className="font-medium text-foreground dark:text-zinc-300">
            Hors classement.
          </span>{" "}
          {unrankedExplanation(
            row.unrankedReason ?? "sans-note",
            row.scoredMeetings,
            ranking.minScoredMeetings,
          )}
        </p>
      </div>
    );
  }

  // Sur 5, l'écart est celui du classement, calculé sur les notes affichées.
  // Sur 100, il se recalcule sur les mêmes membres classés, à partir des
  // moyennes entières : les deux disent la même chose à deux échelles.
  const ecart =
    echelle === "sur5"
      ? row.deltaToTeamAverage
      : row.salesScoreAvg != null && standing.averageSalesScore != null
        ? row.salesScoreAvg - standing.averageSalesScore
        : null;

  // Seul au classement, le rang ne dit rien : « 1re place sur 1 classé » se lit
  // comme une victoire, alors qu'il n'y avait personne en face. L'écart ne dit
  // rien non plus, puisque la moyenne d'équipe est cette note elle-même et que
  // l'écart vaut donc zéro par construction. Restent le palier et la note, qui
  // sont absolus et gardent tout leur sens sans personne à qui se comparer.
  if (ranking.rankedCount <= 1) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <div className="flex flex-wrap items-center gap-2">
          <TeamTierBadge tier={row.tier} />
          <NoteAvecBase
            note={row.noteGlobaleOn5}
            score={row.salesScoreAvg}
            scored={row.scoredMeetings}
            echelle={echelle}
          />
        </div>
        <p className="text-muted-foreground max-w-prose text-[11px] leading-tight">
          Seul membre classé sur la période : le palier reste calculé sur
          l&apos;échelle, le rang attend qu&apos;il y ait à qui se comparer.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground dark:bg-zinc-800 dark:text-zinc-100"
          title={`${rankLabel(row.rank)} parmi les ${membresClasses(
            ranking.rankedCount,
          )} ${GROUPE[comparisonGroup].parmi}${row.tied ? ", ex æquo" : ""}.`}
        >
          <span className="tabular-nums">{rankLabel(row.rank)}</span>
          {/*
            « sur 7 classés » et non « sur 7 » : la note « 4,3/5 » est écrite
            trois éléments plus loin sur la même ligne, et un nombre nu derrière
            « sur » s'y lirait comme le dénominateur d'une note. Le mot dit aussi
            que ces 7 ne sont pas l'équipe entière, qui en compte 10.

            « classés » est écrit au pluriel une fois pour toutes, sans test
            d'accord : le retour anticipé ci-dessus a déjà renvoyé la fiche pour
            un seul membre classé, si bien qu'ici le compte vaut deux au
            minimum. Un singulier conditionnel serait une branche que rien ne
            peut atteindre, et laisserait croire qu'elle protège quelque chose.

            Le libellé long, « membres classés », est celui de l'infobulle
            au-dessus ; l'insigne, lui, tient sur une ligne à côté d'un rang et
            d'un palier, et se contente du mot qui porte le sens.
          */}
          <span className="font-normal text-muted-foreground dark:text-zinc-400">
            sur {ranking.rankedCount} classés
          </span>
        </span>
        <TeamTierBadge tier={row.tier} />
        <NoteAvecBase
          note={row.noteGlobaleOn5}
          score={row.salesScoreAvg}
          scored={row.scoredMeetings}
          echelle={echelle}
        />
      </div>
      {moyenne != null && ecart != null ? (
        <p className="text-muted-foreground text-[11px] leading-tight">
          {phraseEcart(
            ecart,
            moyenne,
            ranking.rankedCount,
            comparisonGroup,
            echelle,
          )}
        </p>
      ) : null}
    </div>
  );
}
