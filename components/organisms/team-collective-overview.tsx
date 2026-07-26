import { TeamRankingSummary } from "@/components/molecules/team-ranking-summary";
import { TEAM_TIER_CLASS } from "@/components/molecules/team-tier-badge";
import { prospectInitials } from "@/lib/prospect-initials";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import { cn } from "@/lib/utils";
import type { OrgAdminTeamCollective } from "@/src/core/application/get-org-admin-dashboard";
import {
  formatEcartCompetence,
  SELLER_SKILL_LABEL_FR,
} from "@/src/core/domain/seller-skill-signature";
import {
  amplitudeDesNotes,
  ecartMinimalSurPiste,
  nombreDeStratesParLargeur,
  teamDispersionDots,
  teamSkillOverview,
  type TeamDispersionDot,
  type TeamDispersionEntry,
} from "@/src/core/domain/team-collective-view";
import {
  formatNoteFr,
  NOTE_ON5_MAX,
  RANKING_TIERS,
  rankLabel,
  tierFromNoteOn5,
  type TeamRankingSummary as TeamRankingSummaryData,
} from "@/src/core/domain/team-ranking";
import type { CSSProperties } from "react";

/**
 * Ce que le manager voit de son équipe avant de lire une seule ligne.
 *
 * Le tableau qui suit répond ligne à ligne : qui est où, avec quelle note. Deux
 * questions lui échappent, et ce sont celles qu'un manager pose en premier.
 * D'abord « mon équipe est-elle groupée ou coupée en deux ? », que la moyenne
 * ne peut pas dire : 3,7 de moyenne, ce sont cinq personnes à 3,7, ou deux à
 * 4,6 et trois à 3,1, et ces deux équipes n'appellent pas le même coaching.
 * Ensuite « sur quoi former tout le monde ? », que le tableau ne dit pas non
 * plus, puisqu'il ne donne le point faible que d'une personne à la fois.
 *
 * Les deux cartes lisent exactement les mêmes nombres que le tableau : la piste
 * place les membres classés à la note écrite dans leur ligne, et les barres
 * partent de la référence d'équipe à laquelle la colonne « Profil » compare
 * chacun. Un « +17 » lu sur une ligne se rapporte donc bien à la barre affichée
 * au-dessus.
 */

const PASTILLE_PX = 28;
/** Filet de fond qui détache une pastille de celle qu'elle recouvre à moitié. */
const ANNEAU_PX = 2;
/** Ce qu'une pastille occupe vraiment à l'écran, anneau compris. */
const EMPRISE_PX = PASTILLE_PX + 2 * ANNEAU_PX;
/** Hauteur d'une strate : l'emprise d'une pastille, plus l'air au-dessus. */
const STRATE_PX = EMPRISE_PX + 6;

/**
 * Les largeurs de piste pour lesquelles un empilement est calculé.
 *
 * Un empilement calculé pour une piste étroite ne devient jamais faux quand la
 * piste s'élargit, mais il devient bête : il monte en escalier là où il avait
 * toute la place de rester à plat, et l'œil lit cet escalier comme une tendance
 * alors qu'il n'encode rien. Un seul empilement, celui du téléphone, ne suffit
 * donc pas.
 *
 * Les crans sont posés là où le dessin change vraiment. Avec une emprise de 32
 * pixels et 2 pixels de respiration, deux notes séparées de 0,5 point cessent
 * de se chevaucher à partir de 340 pixels de piste, 0,3 point à partir de 567,
 * 0,2 point à partir de 850 : les trois largeurs hautes encadrent ces seuils,
 * arrondies au multiple de 8 supérieur. Les seuils intermédiaires sont sautés
 * volontairement, parce qu'un cran coûte deux propriétés personnalisées sur
 * chaque pastille alors qu'un cran sauté ne coûte qu'une strate de hauteur en
 * trop, jamais un chevauchement.
 *
 * La première largeur, elle, n'est pas un seuil mais un plancher : c'est la
 * place qui reste à l'intérieur de la carte sur le plus petit téléphone visé,
 * marges et bordure déduites. La régler plus haut paraît plus confortable et ne
 * l'est pas : la piste se met alors à défiler horizontalement sur téléphone, et
 * le manager voit une bande de paliers sans savoir que ses commerciaux sont à
 * droite, hors de l'écran.
 *
 * Chaque largeur est écrite deux fois, une fois en nombre pour le calcul et une
 * fois dans une classe utilitaire pour le dessin, parce qu'une classe
 * construite à l'exécution ne serait pas vue par le compilateur de feuilles de
 * style. `tests/piste-bascule.test.ts` garde les deux écritures d'accord.
 */
const REGIMES_DE_PISTE = [
  {
    largeurPx: 232,
    variableHauteur: "--piste-hauteur-0",
    variableBas: "--pastille-bas-0",
    classeHauteur: "h-[var(--piste-hauteur-0)]",
    classeBas: "bottom-[var(--pastille-bas-0)]",
  },
  {
    largeurPx: 344,
    variableHauteur: "--piste-hauteur-1",
    variableBas: "--pastille-bas-1",
    classeHauteur: "@min-[344px]:h-[var(--piste-hauteur-1)]",
    classeBas: "@min-[344px]:bottom-[var(--pastille-bas-1)]",
  },
  {
    largeurPx: 568,
    variableHauteur: "--piste-hauteur-2",
    variableBas: "--pastille-bas-2",
    classeHauteur: "@min-[568px]:h-[var(--piste-hauteur-2)]",
    classeBas: "@min-[568px]:bottom-[var(--pastille-bas-2)]",
  },
  {
    largeurPx: 856,
    variableHauteur: "--piste-hauteur-3",
    variableBas: "--pastille-bas-3",
    classeHauteur: "@min-[856px]:h-[var(--piste-hauteur-3)]",
    classeBas: "@min-[856px]:bottom-[var(--pastille-bas-3)]",
  },
] as const;

/** La piste ne descend jamais sous son premier régime : c'est son plancher. */
const PISTE_LARGEUR_PLANCHER_PX = REGIMES_DE_PISTE[0].largeurPx;

const ECART_MINIMAL_PAR_REGIME = REGIMES_DE_PISTE.map((regime) =>
  ecartMinimalSurPiste(regime.largeurPx, EMPRISE_PX),
);
const CLASSES_HAUTEUR = REGIMES_DE_PISTE.map((regime) => regime.classeHauteur);
const CLASSES_BAS = REGIMES_DE_PISTE.map((regime) => regime.classeBas);

/**
 * Un empilement écrit en propriétés personnalisées, une par régime.
 *
 * Les strates voyagent toutes jusqu'à la feuille de style, qui garde celle du
 * régime correspondant à la largeur réellement obtenue par la piste.
 */
function variablesDeStrates(
  cle: "variableHauteur" | "variableBas",
  strates: readonly number[],
  minimum: number,
): CSSProperties {
  const style: Record<string, string> = {};
  for (const [index, regime] of REGIMES_DE_PISTE.entries()) {
    style[regime[cle]] =
      `${Math.max(minimum, strates[index] ?? 0) * STRATE_PX}px`;
  }
  /*
    React ne type que les propriétés du CSS qu'il connaît : un dictionnaire de
    propriétés personnalisées ne lui ressemble pas assez pour être converti
    d'un seul trait.
  */
  return style as unknown as CSSProperties;
}

/** Les notes écrites sous la piste : les bornes, et chaque changement de palier. */
const GRADUATIONS = [
  0,
  ...RANKING_TIERS.slice(1).map((tier) => tier.minNoteOn5),
  NOTE_ON5_MAX,
];

/*
  « min-w-0 » n'est pas décoratif : ces cartes sont les cases d'une grille, et
  une case de grille refuse par défaut de descendre sous la largeur minimale de
  son contenu. La piste, qui réclame sa largeur plancher, poussait donc la carte
  entière hors de l'écran d'un téléphone au lieu de défiler dans son cadre.
*/
const CARTE =
  "min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900";
const TITRE =
  "text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50";
const LEGENDE = "text-xs leading-relaxed text-zinc-500 dark:text-zinc-400";

/** Position d'une note sur l'axe, en pourcentage de la largeur de la piste. */
function positionSurAxe(note: number): string {
  return `${(note / NOTE_ON5_MAX) * 100}%`;
}

/** « 1,2 point » · « 2,4 points ». Le pluriel commence à deux, comme en français. */
function points(valeur: number): string {
  return `${formatNoteFr(valeur)} point${valeur >= 2 ? "s" : ""}`;
}

function commerciaux(n: number): string {
  return n <= 1 ? `${n} commercial coaché` : `${n} commerciaux coachés`;
}

/**
 * Les quatre paliers dessinés à leur vraie place sur l'axe.
 *
 * Ils tiennent lieu de légende : un palier lu sur cette bande dit du même coup
 * son nom, sa couleur et la tranche de notes qu'il couvre, là où une rangée de
 * pastilles posée à côté du titre cache la tranche dans une infobulle que le
 * doigt n'atteint pas.
 */
function BandeDesPaliers() {
  return (
    <div className="flex overflow-hidden rounded-md">
      {RANKING_TIERS.map((tier, index) => {
        const haut = tier.maxNoteOn5 ?? NOTE_ON5_MAX;
        return (
          <span
            key={tier.id}
            className={cn(
              "truncate px-1 py-1 text-center text-[11px] leading-4 font-semibold",
              TEAM_TIER_CLASS[tier.id],
              /*
                Le filet de séparation est de la couleur de la carte, et il est
                pris sur la largeur du palier plutôt qu'ajouté entre eux : les
                quatre bandes continuent de couvrir exactement l'axe, et 3
                reste à 60 % de la piste comme sous la pastille qui s'y pose.
              */
              index < RANKING_TIERS.length - 1 &&
                "border-r-2 border-white dark:border-zinc-900",
            )}
            style={{
              width: `${((haut - tier.minNoteOn5) / NOTE_ON5_MAX) * 100}%`,
            }}
          >
            {tier.nom}
          </span>
        );
      })}
    </div>
  );
}

/** La piste : les pastilles empilées, la bande des paliers, les graduations. */
function PisteDeRepartition({
  dots,
  moyenne,
}: {
  dots: readonly TeamDispersionDot[];
  moyenne: number | null;
}) {
  const strates = nombreDeStratesParLargeur(dots);

  return (
    /*
      Le conteneur de requête est la case qui défile, pas la fenêtre : la piste
      vit à côté d'une barre latérale qui s'ouvre et se ferme, et une largeur de
      fenêtre ne dit donc rien de la place réellement laissée à l'échelle.
    */
    <div className="@container overflow-x-auto pt-1 pb-0.5">
      <div className="relative" style={{ minWidth: PISTE_LARGEUR_PLANCHER_PX }}>
        {/*
          Le trait de moyenne passe sous les pastilles : posé au-dessus, il
          barrerait les initiales de ceux qui sont justement au milieu.
        */}
        {moyenne != null ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-zinc-400 dark:border-zinc-500"
            style={{ left: positionSurAxe(moyenne) }}
          />
        ) : null}
        {/*
          Une strate au minimum, même sans personne à poser : sans elle la bande
          des paliers viendrait se coller sous le titre, et la carte changerait
          de hauteur le jour où le premier membre est classé.
        */}
        <div
          className={cn("relative", ...CLASSES_HAUTEUR)}
          style={variablesDeStrates("variableHauteur", strates, 1)}
        >
          {dots.map((dot) => {
            /*
              `tierFromNoteOn5` ne rend `null` que pour une note absente ou non
              finie ; celle-ci vient d'un membre classé, donc d'un nombre.
            */
            const tier = tierFromNoteOn5(dot.valeur)!;
            return (
              <span
                key={dot.cle}
                className={cn(
                  "absolute flex items-center justify-center rounded-full text-[11px] leading-none font-semibold",
                  TEAM_TIER_CLASS[tier.id],
                  // Après la classe de palier, qui porte sa propre couleur
                  // d'anneau : ici c'est la carte qu'on veut voir entre deux
                  // pastilles qui se chevauchent, pas un second violet.
                  "ring-2 ring-white dark:ring-zinc-900",
                  ...CLASSES_BAS,
                )}
                style={{
                  ...variablesDeStrates("variableBas", dot.strates, 0),
                  left: positionSurAxe(dot.valeur),
                  width: PASTILLE_PX,
                  height: PASTILLE_PX,
                  transform: "translateX(-50%)",
                }}
                title={`${dot.libelle} · ${formatNoteFr(dot.valeur)}/5 · ${
                  tier.nom
                } · ${rankLabel(dot.rang)}`}
              >
                {prospectInitials(dot.libelle)}
              </span>
            );
          })}
        </div>
        <BandeDesPaliers />
        <div className="relative mt-1 h-4">
          {GRADUATIONS.map((graduation) => (
            <span
              key={graduation}
              className="absolute top-0 text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400"
              style={
                graduation === 0
                  ? { left: 0 }
                  : graduation === NOTE_ON5_MAX
                    ? { right: 0 }
                    : {
                        left: positionSurAxe(graduation),
                        transform: "translateX(-50%)",
                      }
              }
            >
              {formatNoteFr(graduation)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** La phrase qui dit, en une ligne, ce que la piste montre. */
function phraseDeRepartition(
  dots: readonly TeamDispersionDot[],
  minScoredMeetings: number,
): string {
  const bornes = amplitudeDesNotes(dots);
  if (bornes == null) {
    return `Personne n'est encore au classement : la piste se remplit dès qu'un membre atteint ${minScoredMeetings} rendez-vous notés.`;
  }
  if (dots.length === 1) {
    return `Un seul membre est classé, à ${formatNoteFr(
      bornes.haute,
    )}/5 : une répartition demande au moins deux notes à comparer.`;
  }
  if (bornes.amplitude === 0) {
    return `L'équipe est parfaitement groupée : les ${dots.length} membres classés affichent tous ${formatNoteFr(
      bornes.haute,
    )}/5.`;
  }
  return `L'équipe s'étale de ${formatNoteFr(bornes.basse)}/5 à ${formatNoteFr(
    bornes.haute,
  )}/5, soit ${points(bornes.amplitude)} entre le premier et le dernier.`;
}

/** Les six compétences de l'équipe, de la plus haute à la plus basse. */
function CarteDesCompetences({
  collectif,
}: {
  collectif: OrgAdminTeamCollective;
}) {
  const vue = teamSkillOverview(collectif.skillReference);

  return (
    /*
      Le titre nomme la carte en `aria-label` plutôt que par un `id` cité en
      `aria-labelledby` : la section vit dans un composant qu'une page pourrait
      afficher deux fois, et deux `id` identiques dans un document renvoient le
      lecteur d'écran au premier des deux titres.
    */
    <section className={CARTE} aria-label="Compétences de l'équipe">
      <h3 className={TITRE}>Compétences de l&apos;équipe</h3>
      {vue == null ? (
        <p className={cn(LEGENDE, "mt-1.5")}>
          Aucun rendez-vous coaché sur la période : les six compétences du
          commercial se notent pendant l&apos;analyse d&apos;un rendez-vous.
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {vue.relief ? (
              <>
                Point fort de l&apos;équipe :{" "}
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {SELLER_SKILL_LABEL_FR[vue.relief.fort.key]}
                </span>{" "}
                <span className="tabular-nums">
                  ({formatEcartCompetence(vue.relief.fort.ecart)})
                </span>
                . À travailler en priorité :{" "}
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {SELLER_SKILL_LABEL_FR[vue.relief.faible.key]}
                </span>{" "}
                <span className="tabular-nums">
                  ({formatEcartCompetence(vue.relief.faible.ecart)})
                </span>
                .
              </>
            ) : (
              <>
                Les six compétences de l&apos;équipe sont au même niveau,{" "}
                <span className="tabular-nums">{vue.niveauMoyen}/100</span> :
                aucune ne se détache, ni vers le haut ni vers le bas.
              </>
            )}
          </p>
          <ul className="mt-4 space-y-2.5">
            {vue.bars.map((bar) => {
              const extreme =
                vue.relief != null &&
                (bar.key === vue.relief.fort.key ||
                  bar.key === vue.relief.faible.key);
              return (
                <li key={bar.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      {SELLER_SKILL_LABEL_FR[bar.key]}
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                      {/*
                        L'écart n'est écrit que sur les deux compétences que la
                        phrase du haut vient de nommer. Six écarts alignés sous
                        six valeurs feraient un tableau de douze nombres, là où
                        le repère vertical dit déjà de quel côté chaque barre
                        tombe.
                      */}
                      {extreme ? (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {formatEcartCompetence(bar.ecart)}
                        </span>
                      ) : null}
                      <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {bar.valeur}
                      </span>
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <span
                      className="block h-2 rounded-full bg-neutral-200 dark:bg-neutral-800"
                      aria-hidden
                    >
                      <span
                        className="bg-brand block h-full rounded-full"
                        style={{ width: `${bar.valeur}%` }}
                      />
                    </span>
                    {/*
                      Le repère déborde la barre en haut et en bas plutôt que de
                      la traverser : à l'intérieur, il faudrait une couleur qui
                      tienne à la fois sur le violet du rempli et sur le gris du
                      vide, et aucune ne tient sur les deux.
                    */}
                    <span
                      aria-hidden
                      className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
                      style={{ left: `${vue.niveauMoyen}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className={cn(LEGENDE, "mt-3")}>
            Notes sur 100, moyenne de {commerciaux(collectif.skillSellers)} sur
            la période, un vote par personne. Le repère vertical marque le
            niveau moyen de l&apos;équipe, {vue.niveauMoyen}/100.
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Les deux lectures collectives, posées entre le titre et le tableau : la
 * répartition des membres autour de la moyenne, puis le relief des six
 * compétences de l'équipe.
 */
export function TeamCollectiveOverview({
  collectif,
  ranking,
  totalCount,
}: {
  collectif: OrgAdminTeamCollective;
  ranking: TeamRankingSummaryData;
  /** Effectif de l'équipe entière, classés et non classés confondus. */
  totalCount: number;
}) {
  const entries: TeamDispersionEntry[] = collectif.dispersion.map((membre) => ({
    cle: membre.userId,
    libelle: teamMemberDisplayName(membre).primary,
    noteOn5: membre.noteOn5,
    rang: membre.rang,
  }));
  /*
    Les empilements sont calculés une fois pour toutes ici, et non dans chacune
    des deux lectures qui en ont besoin : la phrase et la piste décrivent alors
    forcément la même chose, y compris le jour où l'échelle des régimes bouge.
  */
  const dots = teamDispersionDots(entries, ECART_MINIMAL_PAR_REGIME);

  return (
    <div className="grid gap-3">
      <section className={CARTE} aria-label="Répartition de l'équipe">
        {/*
          La moyenne ouvre la carte que la piste illustre : le grand chiffre et
          le trait vertical qui le marque se lisent d'un seul coup d'œil, ce que
          deux cartes empilées empêchaient.
        */}
        <TeamRankingSummary ranking={ranking} totalCount={totalCount} />
        <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {phraseDeRepartition(dots, ranking.minScoredMeetings)}
        </p>
        <PisteDeRepartition dots={dots} moyenne={ranking.averageNoteOn5} />
        <p className={cn(LEGENDE, "mt-2")}>
          Une pastille par membre classé, à sa note. Deux pastilles l&apos;une
          sur l&apos;autre sont trop proches pour tenir côte à côte.
          {ranking.averageNoteOn5 != null
            ? ` Le trait vertical marque la moyenne d'équipe, ${formatNoteFr(
                ranking.averageNoteOn5,
              )}/5.`
            : null}
        </p>
      </section>
      <CarteDesCompetences collectif={collectif} />
    </div>
  );
}
