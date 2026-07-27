import { ficheMembreHref } from "@/lib/liens-mon-equipe";
import { membres, membresClasses } from "@/lib/accord-fr";
import { plurielFr } from "@/lib/pluriel-fr";
import { prospectInitials } from "@/lib/prospect-initials";
import { teamMemberDisplayName } from "@/lib/team-member-display-name";
import {
  formatEcartCompetence,
  SELLER_SKILL_LABEL_FR,
  type SellerSkillSignature,
} from "@/src/core/domain/seller-skill-signature";
import { formatNoteFr, rankLabel } from "@/src/core/domain/team-ranking";

/**
 * Ce que le manager doit regarder en premier, tiré du classement déjà calculé.
 *
 * Le tableau de bord ouvrait sur trois compteurs d'activité, puis sur un
 * tableau : des données, pas une lecture. La question d'un manager qui se
 * connecte n'est pourtant pas « combien de rendez-vous » mais « où dois-je
 * agir ». Ces trois cartes y répondent avant tout le reste : qui tire l'équipe,
 * qui a besoin d'un coaching en premier, et qui n'a pas encore de quoi être
 * évalué.
 *
 * Tout est calculé ici, en fonctions pures, plutôt que dans le composant qui
 * l'affiche : ce composant écrit des liens, donc importe « @/i18n/navigation »,
 * que Jest ne sait pas charger. Une règle posée là-bas serait une règle
 * qu'aucun test ne peut relire.
 */

/** Ce qu'il faut pour situer un membre classé : la dispersion le porte déjà. */
export type MembreClasseDeLaDispersion = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  /** Note du membre, sur 5. */
  noteOn5: number;
  rang: number;
};

/** Une ligne du tableau, réduite à ce que les cartes vont y chercher. */
export type LigneAvecSignature = {
  userId: string;
  skillSignature: SellerSkillSignature | null;
};

/** Les seuls champs du résumé de classement dont les cartes ont besoin. */
export type ResumeDuClassement = {
  rankedCount: number;
  unrankedNoScoreCount: number;
  unrankedLowVolumeCount: number;
  minScoredMeetings: number;
};

export type MembreMisEnAvant = {
  userId: string;
  nom: string;
  initiales: string;
  /** « 4,3 », prête à poser devant un « /5 ». */
  note: string;
  /** « 1re place sur 5 membres classés ». */
  rangEtBase: string;
  /**
   * « Point fort · Écoute active +17 » sur la carte de tête, « À travailler ·
   * Assertivité −12 » sur la carte de coaching : le vocabulaire exact des
   * pastilles de la fiche, pour que la carte et la fiche qu'elle ouvre disent
   * la même chose.
   *
   * `null` quand la ligne du membre n'est pas sur la page chargée ou ne porte
   * pas de signature : la carte se tait plutôt que d'inventer.
   */
  competence: string | null;
  href: string;
};

export type EssentielDuManager = {
  /** Le membre au premier rang, ou `null` quand personne n'est classé. */
  meneur: MembreMisEnAvant | null;
  /**
   * « à égalité avec 1 autre membre » quand le premier rang est partagé.
   *
   * Sans cette mention, la carte nommerait une seule personne « en tête » un
   * jour où deux membres affichent la même note : une première place exclusive
   * que le classement ne décerne pas.
   */
  premierRangPartage: string | null;
  /**
   * Le membre au dernier rang, ou `null` s'il n'y a pas deux rangs distincts.
   *
   * Quand toute l'équipe partage le premier rang, il n'y a personne « en
   * priorité » : désigner un membre à égalité avec le premier comme premier
   * chantier de coaching contredirait la carte d'à côté.
   */
  aCoacher: MembreMisEnAvant | null;
  /**
   * Les membres sans évaluation, une raison par ligne, dans les mots du
   * bandeau d'équipe : « sans aucun rendez-vous noté » appelle une première
   * analyse, « sous le seuil » appelle seulement du volume. Vide quand tout le
   * monde est classé.
   */
  aFaireAnalyser: string[];
};

function membreMisEnAvant(
  membre: MembreClasseDeLaDispersion,
  ranking: ResumeDuClassement,
  competence: string | null,
  statsWindowDays: number,
  equipePage: number,
): MembreMisEnAvant {
  const affichage = teamMemberDisplayName(membre);
  return {
    userId: membre.userId,
    nom: affichage.primary,
    initiales: prospectInitials(affichage.initialsSource),
    note: formatNoteFr(membre.noteOn5),
    rangEtBase: `${rankLabel(membre.rang)} sur ${membresClasses(
      ranking.rankedCount,
    )}`,
    competence,
    href: ficheMembreHref(membre.userId, statsWindowDays, equipePage),
  };
}

function signatureDeLaLigne(
  rows: readonly LigneAvecSignature[],
  userId: string,
): SellerSkillSignature | null {
  return rows.find((r) => r.userId === userId)?.skillSignature ?? null;
}

export function essentielDuManager(input: {
  /** L'équipe classée entière, triée par rang : jamais la page affichée. */
  dispersion: readonly MembreClasseDeLaDispersion[];
  /** La page de lignes chargée, où chercher une signature de compétences. */
  rows: readonly LigneAvecSignature[];
  ranking: ResumeDuClassement;
  statsWindowDays: number;
  equipePage: number;
}): EssentielDuManager {
  const { dispersion, rows, ranking } = input;

  const premier = dispersion[0] ?? null;
  const dernier =
    dispersion.length > 0 ? dispersion[dispersion.length - 1]! : null;

  const meneur =
    premier == null
      ? null
      : membreMisEnAvant(
          premier,
          ranking,
          (() => {
            const s = signatureDeLaLigne(rows, premier.userId);
            return s == null
              ? null
              : `Point fort · ${SELLER_SKILL_LABEL_FR[s.fort]} ${formatEcartCompetence(s.ecartFort)}`;
          })(),
          input.statsWindowDays,
          input.equipePage,
        );

  const partagentLePremierRang =
    premier == null
      ? 0
      : dispersion.filter((m) => m.rang === premier.rang).length - 1;

  const aCoacher =
    premier == null || dernier == null || dernier.rang === premier.rang
      ? null
      : membreMisEnAvant(
          dernier,
          ranking,
          (() => {
            const s = signatureDeLaLigne(rows, dernier.userId);
            return s == null
              ? null
              : `À travailler · ${SELLER_SKILL_LABEL_FR[s.faible]} ${formatEcartCompetence(s.ecartFaible)}`;
          })(),
          input.statsWindowDays,
          input.equipePage,
        );

  const aFaireAnalyser: string[] = [];
  if (ranking.unrankedNoScoreCount > 0) {
    aFaireAnalyser.push(
      `${membres(ranking.unrankedNoScoreCount)} sans aucun rendez-vous noté sur la période`,
    );
  }
  if (ranking.unrankedLowVolumeCount > 0) {
    aFaireAnalyser.push(
      `${membres(ranking.unrankedLowVolumeCount)} sous le seuil de ${ranking.minScoredMeetings} rendez-vous notés`,
    );
  }

  return {
    meneur,
    premierRangPartage:
      partagentLePremierRang > 0
        ? `à égalité avec ${partagentLePremierRang} ${plurielFr(
            partagentLePremierRang,
            "autre membre",
            "autres membres",
          )}`
        : null,
    aCoacher,
    aFaireAnalyser,
  };
}

/** Vrai quand aucune des trois cartes n'a quoi que ce soit à dire. */
export function essentielEstVide(essentiel: EssentielDuManager): boolean {
  return (
    essentiel.meneur == null &&
    essentiel.aCoacher == null &&
    essentiel.aFaireAnalyser.length === 0
  );
}
