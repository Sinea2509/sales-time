import { membres, membresClasses } from "@/lib/accord-fr";
import { plurielFr } from "@/lib/pluriel-fr";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  amplitudeDesNotes,
  membresAuPalier,
  type TeamDispersionDot,
} from "@/src/core/domain/team-collective-view";
import {
  formatNoteFr,
  PREMIER_PALIER_HAUT,
  tierFromNoteOn5,
  type TeamRankingSummary as TeamRankingSummaryData,
} from "@/src/core/domain/team-ranking";

/**
 * Phrase des exclusions, une raison à la fois.
 *
 * Additionner « sans note » et « pas assez de notes » produirait une phrase
 * fausse pour la moitié des personnes concernées : la première attend qu'un
 * rendez-vous soit analysé, la seconde attend seulement du volume. Le manager
 * lit ici l'action, pas un total.
 */
function horsClassement(ranking: TeamRankingSummaryData): string | null {
  const raisons: string[] = [];
  if (ranking.unrankedLowVolumeCount > 0) {
    raisons.push(
      `${membres(ranking.unrankedLowVolumeCount)} sous le seuil de ${
        ranking.minScoredMeetings
      } rendez-vous notés`,
    );
  }
  if (ranking.unrankedNoScoreCount > 0) {
    raisons.push(
      `${membres(ranking.unrankedNoScoreCount)} sans aucun rendez-vous noté`,
    );
  }
  return raisons.length === 0
    ? null
    : `hors classement : ${raisons.join(", ")}`;
}

/** Un chiffre posé à côté de la moyenne, avec de quoi le relire. */
type Satellite = {
  readonly cle: string;
  readonly libelle: string;
  readonly valeur: string;
  /**
   * L'unité du chiffre, quand ce n'est pas un nombre de personnes.
   *
   * Les satellites occupent des cases identiques, au même corps et au même
   * gras : « 5 », « 3 », « 1,4 » se lisent d'une traite comme trois
   * dénombrements, alors que le dernier est un écart de notes. Le libellé le
   * dit, mais il est au-dessus et en petites capitales, et l'œil descend au
   * chiffre. L'unité est donc écrite à côté du chiffre, comme le « /5 » de la
   * moyenne juste au-dessus.
   *
   * Absente sur les satellites qui comptent des personnes : « 5 personnes sur
   * 7 membres » redirait le mot que la précision porte déjà.
   */
  readonly unite?: string;
  /** Sur quoi le chiffre est pris. Jamais un nombre nu derrière « sur ». */
  readonly precision: string;
};

/**
 * Les chiffres qui empêchent de lire la moyenne toute seule.
 *
 * Une moyenne est le nombre qui cache le plus de choses : 3,4 vaut aussi bien
 * pour une équipe entière posée à 3,4 que pour une équipe coupée en deux. Les
 * trois repères répondent chacun à une question que la moyenne avale : sur
 * combien de personnes elle est calculée, combien sont déjà au niveau, et sur
 * quelle largeur l'équipe s'étale.
 *
 * Un repère qui n'a pas de base de calcul n'est pas rendu, plutôt que rendu à
 * zéro ou en « n. c. » : le bandeau se resserre sur ce qu'il sait dire, et une
 * équipe qui démarre ne lit pas trois cases vides.
 *
 * Exportée pour être relue par « tests/satellites-du-bandeau-equipe.test.ts » :
 * elle ne produit aucune balise, seulement les mots et les chiffres que le
 * manager lit, et c'est là qu'un repère perd son unité ou sa base de calcul.
 */
export function listeDesSatellites(
  ranking: TeamRankingSummaryData,
  totalCount: number,
  dots: readonly TeamDispersionDot[],
): Satellite[] {
  const liste: Satellite[] = [
    {
      cle: "effectif",
      libelle: "Au classement",
      valeur: String(ranking.rankedCount),
      precision: `sur ${membres(totalCount)}`,
    },
  ];

  if (ranking.rankedCount > 0) {
    liste.push({
      cle: "palier",
      libelle: `${PREMIER_PALIER_HAUT.nom} ou plus`,
      valeur: String(membresAuPalier(dots, PREMIER_PALIER_HAUT)),
      precision: `sur ${membresClasses(ranking.rankedCount)}`,
    });
  }

  /*
    L'étalement demande deux notes à comparer. Sur un seul membre classé il
    vaudrait 0, ce qui se lirait « équipe parfaitement groupée » alors qu'il n'y
    a personne avec qui être groupé.
  */
  const bornes = dots.length >= 2 ? amplitudeDesNotes(dots) : null;
  if (bornes != null) {
    liste.push({
      cle: "amplitude",
      libelle: "Écart dans l'équipe",
      valeur: formatNoteFr(bornes.amplitude),
      unite: plurielFr(bornes.amplitude, "point"),
      precision: `de ${formatNoteFr(bornes.basse)} à ${formatNoteFr(
        bornes.haute,
      )}`,
    });
  }

  return liste;
}

/**
 * La ligne qui dit sur quoi le grand chiffre est pris.
 *
 * Jamais un nombre nu derrière « sur » : cette ligne suit immédiatement une
 * note écrite « 3,2/5 », et « classés sur 10 » s'y lirait alors
 * « notés sur 10 ». Les deux effectifs sont donc annoncés séparément, du total
 * vers les classés.
 *
 * À un seul membre classé, le mot « moyenne » disparaît. La valeur affichée est
 * la note de cette personne ; l'annoncer comme une moyenne laisserait croire à
 * un calcul portant sur plusieurs.
 */
function baseDeLaMoyenne(
  ranking: TeamRankingSummaryData,
  totalCount: number,
): string {
  const effectif = `équipe de ${membres(totalCount)}`;
  if (ranking.rankedCount === 0) {
    return `${effectif} · aucun membre classé pour l'instant`;
  }
  if (ranking.rankedCount === 1) {
    return `${effectif} · note du seul membre classé`;
  }
  return `${effectif} · moyenne des ${membresClasses(ranking.rankedCount)}`;
}

/**
 * Ce que le grand chiffre dit exactement, en toutes lettres, au survol.
 *
 * Même règle que la ligne juste au-dessous : à un seul membre classé, ce n'est
 * pas une moyenne, c'est une note.
 */
function detailDeLaMoyenne(
  ranking: TeamRankingSummaryData,
  moyenne: number | null,
): string {
  if (moyenne == null) {
    return "Aucun membre classé : la moyenne n'a pas de base de calcul.";
  }
  if (ranking.rankedCount === 1) {
    return "Note du seul membre classé : avec une seule note, la moyenne est cette note.";
  }
  return `Moyenne des notes affichées des ${membres(
    ranking.rankedCount,
  )} au classement.`;
}

const ETIQUETTE =
  "text-[11px] font-semibold tracking-wider text-white/70 uppercase";

/**
 * Le bandeau d'ouverture de la vue équipe : la moyenne en grand, puis les trois
 * repères qui interdisent de la lire toute seule.
 *
 * Il coiffe la piste de répartition à l'intérieur de la carte de celle-ci, sans
 * cadre à lui. La moyenne annoncée ici est le trait vertical dessiné quelques
 * pixels plus bas, et deux cadres l'un sur l'autre auraient séparé un chiffre
 * de sa propre illustration.
 *
 * Le fond sombre est le seul de la page : c'est ce qui fait de ce chiffre le
 * point d'entrée de l'écran plutôt qu'une valeur parmi les autres. C'est un
 * noir neutre et non plus un violet : la marque signe les actions et la
 * navigation, et un aplat violet de cette taille faisait de la couleur un
 * décor. Les deux halos, eux, restent de la marque : une lumière posée sur le
 * noir, pas une surface. Leur opacité est plafonnée pour que l'encre reste
 * lisible même à l'endroit où ils se cumuleraient. Les contrastes ont été
 * calculés sur le thème clair, seul thème optimisé : sur le fond le plus pâle
 * que les deux halos cumulés produiraient, le blanc plein tient 13,0:1 et le
 * blanc à 70 % tient 7,1:1, au-dessus du seuil de 4,5:1 exigé pour du petit
 * texte. Rien sous 70 % d'opacité ne porte donc de mot.
 *
 * Le palier de la moyenne est écrit, jamais peint : la couleur du palier est
 * calibrée sur fond blanc, et le dernier palier est un violet presque noir,
 * qui disparaîtrait sur ce fond. La piste juste en dessous dessine les quatre
 * bandes à leur couleur, sur le fond pour lequel elles ont été mesurées.
 *
 * L'échelle des paliers n'est pas répétée non plus : la piste les dessine à
 * leur vraie place sur l'axe des notes, ce qu'une rangée d'insignes ne fait
 * pas, elle qui garde ses bornes dans une infobulle qu'un doigt n'ouvre pas.
 */
export function TeamRankingSummary({
  ranking,
  totalCount,
  dots,
}: {
  ranking: TeamRankingSummaryData;
  totalCount: number;
  /** Les membres classés, tels que la piste les pose. Jamais la page en cours. */
  dots: readonly TeamDispersionDot[];
}) {
  const moyenne = ranking.averageNoteOn5;
  const palier = tierFromNoteOn5(moyenne);
  const exclusions = horsClassement(ranking);
  const satellites = listeDesSatellites(ranking, totalCount, dots);
  const base = baseDeLaMoyenne(ranking, totalCount);

  return (
    <div className="relative isolate overflow-hidden bg-zinc-950 text-white">
      {/*
        Les deux halos sont posés dans des coins opposés et débordent le cadre :
        un halo entier tenu à l'intérieur se lirait comme une forme, alors que
        celui-ci ne doit se lire que comme une lumière.
      */}
      <span
        aria-hidden
        className="bg-brand/30 pointer-events-none absolute -top-24 -right-16 -z-10 size-64 rounded-full blur-3xl"
      />
      <span
        aria-hidden
        className="bg-brand/15 pointer-events-none absolute -bottom-28 -left-20 -z-10 size-72 rounded-full blur-3xl"
      />

      <div className="px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className={ETIQUETTE}>Moyenne d&apos;équipe</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span
                className="text-4xl leading-none font-semibold tracking-tight tabular-nums sm:text-5xl"
                title={detailDeLaMoyenne(ranking, moyenne)}
              >
                {moyenne == null
                  ? VALEUR_NON_CALCULABLE
                  : formatNoteFr(moyenne)}
              </span>
              {moyenne == null ? null : (
                <span className="text-lg font-medium text-white/70">/5</span>
              )}
            </p>
          </div>
          {palier == null ? null : (
            <span className="mt-0.5 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-semibold whitespace-nowrap">
              Palier {palier.nom}
            </span>
          )}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-white/70">
          {base}
          {exclusions ? ` · ${exclusions}` : null}
        </p>
      </div>

      {/*
        Les satellites s'empilent sur téléphone et s'alignent dès qu'il y a la
        place : à trois de front sur une carte de 232 pixels, « sur 7 classés »
        se couperait en trois lignes sous un chiffre de deux caractères.
      */}
      <div className="flex flex-col divide-y divide-white/15 border-t border-white/15 sm:flex-row sm:divide-x sm:divide-y-0">
        {satellites.map((satellite) => (
          <div key={satellite.cle} className="flex-1 px-4 py-3 sm:px-5">
            <p className={ETIQUETTE}>{satellite.libelle}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums">
                {satellite.valeur}
              </span>
              {/*
                Le retrait reprend les deux tiers de l'espacement : l'unité se
                colle à son chiffre, la précision reste à distance. Sans lui,
                les trois blocs sont également espacés et « points de 2,9 à
                4,3 » se lit d'un trait, comme si les points allaient de 2,9 à
                4,3.
              */}
              {satellite.unite == null ? null : (
                <span className="-ml-1 text-xs font-medium text-white/70">
                  {satellite.unite}
                </span>
              )}
              <span className="text-xs text-white/70">
                {satellite.precision}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
