import { Link } from "@/i18n/navigation";
import { TeamMemberInviteDialog } from "@/components/organisms/team-member-invite-dialog";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import { DataTableHead } from "@/components/molecules/data-table-head";
import { SkillSignatureCell } from "@/components/molecules/seller-skill-signature-view";
import { TeamRankCell } from "@/components/molecules/team-rank-cell";
import { TeamTierBadge } from "@/components/molecules/team-tier-badge";
import { TeamCollectiveOverview } from "@/components/organisms/team-collective-overview";
import { buttonVariants } from "@/components/ui/button";
import { membres, rdvNotes } from "@/lib/accord-fr";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { formatNoteOn5 } from "@/lib/format-note-on5";
import { prospectInitials } from "@/lib/prospect-initials";
import { SALES_SCORE_LABEL } from "@/lib/sales-score-color";
import {
  cardHeadingTag,
  cardSubsectionTitleClass,
  sectionHeadingClass,
  type CardHeadingTag,
} from "@/lib/page-typography";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import { cn } from "@/lib/utils";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import { unrankedExplanation } from "@/src/core/domain/team-ranking";
import type { OrgAdminMonEquipePage } from "@/src/core/application/get-org-admin-dashboard";
import type { ReactNode } from "react";

function monEquipeListHref(
  basePath: string,
  jours: number,
  equipePage: number,
) {
  const q = new URLSearchParams();
  q.set("jours", String(jours));
  if (equipePage > 1) {
    q.set("equipePage", String(equipePage));
  }
  return `${basePath}?${q.toString()}`;
}

/**
 * Ce que la liste contient et dans quel ordre.
 *
 * L'ordre affiché est le classement lui-même, et il n'est pas devinable : deux
 * lignes voisines peuvent porter la même note sans porter la même place, et la
 * fin de liste change de sens selon qu'elle contient ou non des membres hors
 * classement. La phrase ne décrit donc que les cas réellement présents à
 * l'écran, plutôt que d'annoncer une fin de liste qui n'existe pas.
 */
function ordreDeLaListe(monEquipe: OrgAdminMonEquipePage): string {
  const effectif = membres(monEquipe.totalCount);
  if (monEquipe.ranking.rankedCount === 0) {
    return `${effectif} · aucun n'est encore classé`;
  }
  return monEquipe.ranking.unrankedCount === 0
    ? `${effectif} · du premier au dernier du classement`
    : `${effectif} · du premier au dernier du classement, puis les membres hors classement`;
}

/**
 * Le titre d'une carte, au rang que la section lui donne.
 *
 * Le rang arrive par une propriété plutôt que par une variable fabriquée dans
 * le corps de la section : une majuscule posée sur une variable locale et
 * employée comme balise se lit, pour l'analyseur, comme un composant redéfini à
 * chaque rendu, ce qu'il refuse.
 */
function TitreDeCarte({
  niveau: Titre,
  children,
}: {
  niveau: CardHeadingTag;
  children: ReactNode;
}) {
  return <Titre className={cardSubsectionTitleClass}>{children}</Titre>;
}

export function MonEquipeSection({
  monEquipe,
  statsWindowDays,
  currentUserEmail,
  listBasePath = "/company/equipe",
  showHeading = true,
  showInvite = true,
}: {
  monEquipe: OrgAdminMonEquipePage;
  statsWindowDays: number;
  currentUserEmail: string;
  /** Base path for pagination links (default: dedicated team page). */
  listBasePath?: string;
  /**
   * Titre porté par la section elle-même.
   *
   * Vrai quand la section vit au milieu d'autres sections et a besoin de se
   * nommer. Faux quand la page porte déjà ce titre en tête : deux « Mon équipe »
   * l'un sous l'autre, à deux tailles différentes, se lisent comme un doublon.
   */
  showHeading?: boolean;
  /**
   * Bouton d'invitation porté par la section elle-même.
   *
   * Faux quand la page le range dans son propre en-tête, à côté du sélecteur de
   * période : sans titre pour l'accompagner, ce bouton occupait ici une ligne
   * entière pour lui seul, juste au-dessous d'une autre ligne à un seul
   * élément.
   */
  showInvite?: boolean;
}) {
  const lastPage = Math.max(
    1,
    Math.ceil(monEquipe.totalCount / monEquipe.pageSize),
  );
  /*
    Les titres de cartes prennent leur rang de la section : « h3 » sous le
    « Mon équipe » qu'elle écrit elle-même, « h2 » quand c'est la page qui le
    porte et qu'elle se tait. Sans ce report, la page dédiée enchaînait son
    « h1 » sur des « h3 » : le rang 2 absent se lit, pour qui navigue de titre
    en titre, comme un titre que l'on n'a pas su atteindre.
  */
  const niveauDeTitre = cardHeadingTag(showHeading);

  return (
    <section className="space-y-3">
      {showHeading || showInvite ? (
        /*
          Sans titre, le bouton reste seul sur sa ligne : il se range à droite,
          là où il se trouve déjà quand le titre l'accompagne, plutôt que de
          sauter à gauche d'un écran à l'autre.
        */
        <div
          className={
            showHeading
              ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
          }
        >
          {showHeading ? (
            <h2 className={sectionHeadingClass}>Mon équipe</h2>
          ) : null}
          {showInvite ? (
            <TeamMemberInviteDialog currentUserEmail={currentUserEmail} />
          ) : null}
        </div>
      ) : null}
      {/*
        Les deux lectures collectives viennent avant le tableau : elles portent
        sur l'équipe entière, quand le tableau ne montre qu'une page de membres.
        Les lire après aurait donné à croire qu'elles décrivent ce qui est
        au-dessus d'elles. La moyenne d'équipe est dans la première des deux,
        au-dessus de la piste qui la dessine.
      */}
      <TeamCollectiveOverview
        collectif={monEquipe.collectif}
        ranking={monEquipe.ranking}
        totalCount={monEquipe.totalCount}
        niveauDeTitre={niveauDeTitre}
      />
      {/*
        Même cadre que les deux cartes collectives juste au-dessus : le bord
        était ici un zinc 200 à 10 % d'opacité, donc invisible sur blanc, et
        l'ombre était d'un cran plus lourde. Des trois cartes empilées, une
        seule flottait.
      */}
      <section
        aria-label="Détail membre par membre"
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/*
          La carte se nomme, comme les deux au-dessus d'elle. Sans titre, le
          tableau semblait détailler la carte des compétences qui le précède,
          alors qu'il ne détaille que le classement.
        */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-zinc-200 px-4 py-3.5 sm:px-5 dark:border-zinc-800">
          <TitreDeCarte niveau={niveauDeTitre}>Membre par membre</TitreDeCarte>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {ordreDeLaListe(monEquipe)}
          </p>
        </div>
        {/*
          Les colonnes s'effacent par ordre inverse d'importance quand la place
          manque, exactement comme le tableau du tableau de bord commercial le
          fait déjà. Il reste toujours la place, la personne et la note : les
          trois réponses que le manager vient chercher. Le reste se retrouve
          d'une tape sur la fiche, qui l'écrit en toutes lettres.

          Ce qui décide ici, c'est la largeur de ce bloc et non celle de la
          fenêtre. Les deux ne varient pas ensemble : le menu latéral s'ouvre à
          768px et prend 256px, si bien qu'en passant de 767 à 768px de fenêtre
          la place disponible dans ce bloc tombe de 717px à 462px. La fenêtre
          grandit d'un pixel, le tableau en perd 255. Réglé sur la fenêtre, il
          ajoutait justement une colonne à cet endroit : 575px de contenu pour
          462px de place, six noms sur sept coupés. Réglé sur le bloc, il ne
          peut plus le faire.

          Chaque seuil est la largeur au-dessous de laquelle la colonne qu'il
          commande ramènerait « Personne » sous 260px, la place qu'il faut au
          plus long nom pour ne pas être coupé. C'est le nom qui arbitre : il
          est ce qu'on lit en premier, et le seul contenu du tableau qui ne se
          devine pas une fois tronqué. Les seuils valent donc 580, 670, 750 et
          940px, et laissent à « Personne » 261, 262, 266 et 266px.
        */}
        <div className="@container overflow-x-auto">
          {/*
            Ces largeurs minimales sont des garde-fous, pas la mise en page :
            chacune est réglée sous ce que le contenu réclame dans son régime,
            mesuré à 296px à trois colonnes, 487px à quatre, 575px à cinq,
            652px à six et 842px à sept. Elles ne se déclenchent donc que sur un
            bloc plus étroit que prévu, pour faire défiler plutôt qu'écraser les
            colonnes, et jamais sur un bloc à la largeur attendue.
          */}
          <table className="w-full min-w-[290px] text-left text-sm @min-[580px]:min-w-[480px] @min-[670px]:min-w-[560px] @min-[750px]:min-w-[640px] @min-[940px]:min-w-[820px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/80">
                <DataTableHead
                  className="w-16 px-4 py-3.5 @min-[580px]:w-24 dark:text-zinc-400"
                  title={`Rang sur l'équipe entière, et écart à la moyenne des membres classés. Au-dessous de ${monEquipe.ranking.minScoredMeetings} rendez-vous notés, le score est affiché mais pas le rang.`}
                >
                  Rang
                </DataTableHead>
                <DataTableHead className="px-4 py-3.5 dark:text-zinc-400">
                  Personne
                </DataTableHead>
                <DataTableHead
                  className="hidden px-4 py-3.5 tabular-nums @min-[670px]:table-cell dark:text-zinc-400"
                  title="Nombre de rendez-vous portant au moins une analyse KISS sur la période. Tous ne sont pas notés : la note vient de l'analyse SONCAS."
                >
                  RDV coachés
                </DataTableHead>
                <DataTableHead
                  className="hidden px-4 py-3.5 tabular-nums @min-[750px]:table-cell dark:text-zinc-400"
                  title="Temps d'appel moyen sur les RDV connectés (durée renseignée)"
                >
                  TAM
                </DataTableHead>
                <DataTableHead
                  className="px-4 py-3.5 tabular-nums dark:text-zinc-400"
                  title="Moyenne SalesScore sur 5 (analyses SONCAS sur la période)"
                >
                  {SALES_SCORE_LABEL}
                </DataTableHead>
                <DataTableHead
                  className="hidden px-4 py-3.5 @min-[580px]:table-cell dark:text-zinc-400"
                  title={`Palier atteint sur l'échelle de 0 à 5. Deux membres peuvent partager un palier sans partager une place. Au-dessous de ${monEquipe.ranking.minScoredMeetings} rendez-vous notés, la note est affichée mais le palier n'est pas décerné.`}
                >
                  Palier
                </DataTableHead>
                <DataTableHead
                  className="hidden px-4 py-3.5 @min-[940px]:table-cell dark:text-zinc-400"
                  title="Ce qui distingue cette personne du reste de l'équipe : sa compétence la plus au-dessus de la moyenne, et la plus au-dessous. Les six compétences sont notées sur le commercial lui-même, à chaque rendez-vous coaché."
                >
                  Profil
                </DataTableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {monEquipe.rows.length === 0 ? (
                <TableEmptyRow
                  colSpan={7}
                  message="Aucun membre dans cette organisation."
                  size="large"
                />
              ) : (
                monEquipe.rows.map((row) => {
                  const person = teamMemberDisplayName(row);
                  return (
                    /*
                      Le survol prend la teinte de marque plutôt qu'un gris :
                      c'est la même famille que le bandeau d'ouverture et que
                      les pastilles de rang, donc la ligne survolée se rattache
                      à la page au lieu de s'en détacher. L'opacité est réglée à
                      60 % pour que l'encre la plus pâle du tableau, le gris 500
                      du sous-titre de note, tienne encore 4,57:1 sur le fond
                      obtenu, au-dessus du seuil de 4,5:1. À pleine opacité elle
                      tomberait à 4,40:1.
                    */
                    <tr
                      key={row.userId}
                      className="hover:bg-violet-50/60 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <TeamRankCell
                          ranking={row}
                          scoredMeetings={row.scoredMeetings}
                          minScoredMeetings={
                            monEquipe.ranking.minScoredMeetings
                          }
                        />
                      </td>
                      {/*
                        « w-full max-w-0 » fait de cette colonne la colonne
                        élastique : elle prend la place que les autres laissent
                        et coupe proprement, au lieu d'imposer la largeur du
                        plus long nom à tout le tableau. La largeur minimale est
                        ce qui empêche l'élasticité de se retourner contre elle :
                        sans elle, les colonnes à contenu insécable se servent
                        d'abord et le nom tombe à « C… ».
                      */}
                      <td className="w-full max-w-0 min-w-[7.5rem] px-4 py-3.5 align-middle @min-[580px]:min-w-[10.5rem]">
                        <Link
                          href={
                            statsWindowDays === 30
                              ? `/company/equipe/${row.userId}`
                              : `/company/equipe/${row.userId}?jours=${statsWindowDays}`
                          }
                          className="group flex min-w-0 items-center gap-3 rounded-lg py-0.5 pr-2 outline-none transition-colors hover:bg-zinc-100/90 focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:hover:bg-zinc-800/60 dark:focus-visible:ring-zinc-500/40"
                          aria-label={`Fiche de ${person.primary}`}
                        >
                          {/*
                            La pastille d'initiales redit en deux lettres le nom
                            écrit juste à côté. Dans un bloc étroit elle coûte
                            48px pour cela : le nom entier les vaut mieux.
                          */}
                          <span
                            className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 @min-[580px]:flex dark:bg-zinc-800 dark:text-zinc-200"
                            aria-hidden
                          >
                            {prospectInitials(person.initialsSource)}
                          </span>
                          <div className="min-w-0 text-left">
                            {/*
                              Dans un bloc étroit le nom passe à la ligne au lieu
                              d'être coupé : la hauteur ne coûte rien sur un
                              écran qui défile déjà, la largeur coûte tout.
                              Au-delà de 580px la colonne garde 260px et la
                              coupure propre redevient préférable au retour à la
                              ligne, qui déformerait la hauteur des lignes.
                            */}
                            <p className="font-medium text-zinc-950 underline-offset-2 group-hover:underline @min-[580px]:truncate dark:text-zinc-50">
                              {person.primary}
                            </p>
                            {person.secondary ? (
                              // L'adresse e-mail ne sert qu'à départager deux
                              // homonymes : dans un bloc étroit elle coûte plus
                              // de largeur qu'elle n'en rend, et la fiche
                              // l'affiche de toute façon.
                              <p className="text-muted-foreground hidden truncate text-xs @min-[580px]:block dark:text-zinc-400">
                                {person.secondary}
                              </p>
                            ) : null}
                          </div>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3.5 tabular-nums @min-[670px]:table-cell">
                        {row.coachesCount}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3.5 tabular-nums @min-[750px]:table-cell">
                        {row.tamMinutesAvg != null ? (
                          formatDurationHoursMinutes(row.tamMinutesAvg)
                        ) : (
                          <span
                            className="text-muted-foreground dark:text-zinc-400"
                            title="Non calculable : aucun rendez-vous connecté avec une durée renseignée sur la période."
                          >
                            {VALEUR_NON_CALCULABLE}
                          </span>
                        )}
                      </td>
                      <td
                        // Pas de « whitespace-nowrap » ici : le suffixe
                        // « moyenne de 8 RDV notés » revient à la ligne quand la
                        // place manque plutôt que d'imposer sa largeur à toute
                        // la colonne. La note doit rester lisible sans faire
                        // défiler ; la phrase qui la justifie peut tenir sur
                        // deux lignes, la ligne du nom en fait déjà autant.
                        // Sauf sur téléphone, où c'est le nom qui gagne : voir
                        // le commentaire de la ligne de base, plus bas.
                        className="px-4 py-3.5 tabular-nums"
                        title={
                          row.scoredMeetings > 0
                            ? `Moyenne des SalesScores de ${row.scoredMeetings} rendez-vous. Un rendez-vous coaché n'est pas toujours noté : le coaching porte sur l'analyse KISS, la note vient de l'analyse SONCAS.`
                            : "Non calculable : aucun rendez-vous noté sur la période."
                        }
                      >
                        <span className="block font-medium text-zinc-950 dark:text-zinc-50">
                          {formatNoteOn5(row.noteGlobaleOn5)}
                        </span>
                        {/*
                          « moyenne de 6 RDV notés » et non « sur 6 RDV notés » :
                          la fiche du commercial écrit « 3e place sur 7 » deux
                          lignes plus loin, où « sur » veut dire « parmi ». Les
                          deux écrans emploient donc la même formulation, qui ne
                          se lit que d'une seule façon.
                        */}
                        {/*
                          Dans un bloc étroit, la base s'efface quand il y a une
                          note : « 4,3/5 » se lit seul, et les deux lignes que la
                          base lui coûtait reviennent au nom, qui était coupé
                          net. Elle reste affichée quand il n'y a pas de note,
                          parce que « n. c. » ne se lit pas seul et que
                          l'infobulle qui l'explique n'existe pas sous le doigt.
                        */}
                        <span
                          className={
                            row.scoredMeetings > 0
                              ? "hidden text-xs text-zinc-500 @min-[580px]:block dark:text-zinc-400"
                              : "block text-xs text-zinc-500 dark:text-zinc-400"
                          }
                        >
                          {row.scoredMeetings > 0
                            ? `moyenne de ${rdvNotes(row.scoredMeetings)}`
                            : "aucun RDV noté"}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 @min-[580px]:table-cell">
                        <TeamTierBadge
                          tier={row.tier}
                          unavailableTitle={
                            row.unrankedReason
                              ? unrankedExplanation(
                                  row.unrankedReason,
                                  row.scoredMeetings,
                                  monEquipe.ranking.minScoredMeetings,
                                )
                              : undefined
                          }
                        />
                      </td>
                      {/*
                        Un plancher de largeur, et les mots s'enroulent au-delà :
                        « Lien de confiance … » tronqué ne dit plus quelle
                        compétence travailler, et c'est le mot que le manager
                        vient lire ici.

                        Tenues d'un seul tenant, ces deux lignes réclamaient
                        234px, et c'est la colonne « Personne » qui les payait :
                        elle tombait à 173px et six noms sur sept étaient
                        coupés. À 190px enroulés elle garde ses 260px, plus
                        aucun nom n'est coupé, et la ligne la plus haute passe
                        de 81 à 84 pixels.
                      */}
                      <td className="hidden min-w-[190px] px-4 py-3.5 @min-[940px]:table-cell">
                        <SkillSignatureCell
                          signature={row.skillSignature}
                          skillMeetings={row.skillMeetings}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      {monEquipe.totalCount > monEquipe.pageSize ? (
        <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
          <span>
            {membres(monEquipe.totalCount)} · page {monEquipe.page} sur{" "}
            {lastPage}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {monEquipe.page > 1 ? (
              <Link
                href={monEquipeListHref(
                  listBasePath,
                  statsWindowDays,
                  monEquipe.page - 1,
                )}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8",
                )}
              >
                Précédent
              </Link>
            ) : null}
            {monEquipe.page < lastPage ? (
              <Link
                href={monEquipeListHref(
                  listBasePath,
                  statsWindowDays,
                  monEquipe.page + 1,
                )}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8",
                )}
              >
                Suivant
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
