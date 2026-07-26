import { Badge } from "@/components/ui/badge";
import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import {
  formatEcartCompetence,
  SELLER_SKILL_LABEL_FR,
  type SellerSkillSignature,
} from "@/src/core/domain/seller-skill-signature";

/**
 * Ce qui distingue un commercial des autres, écrit de la même façon partout.
 *
 * L'écran affichait auparavant une « Posture », qui valait le levier SONCAS le
 * plus fréquent chez ses prospects : une description de son portefeuille, posée
 * sur sa ligne à lui. Ces deux vues disent maintenant la même chose que le
 * radar de sa fiche, en deux mots : sa compétence la plus au-dessus de son
 * équipe, et la plus au-dessous.
 */

/** La phrase qui explique d'où sortent ces deux compétences. */
function titreComparaison(skillMeetings: number): string {
  const rdv = `${skillMeetings} rendez-vous coaché${skillMeetings > 1 ? "s" : ""}`;
  return `Compétences les plus au-dessus et au-dessous de la moyenne d'équipe, sur ${rdv}. L'écart se lit en points de l'échelle 0 à 100.`;
}

/**
 * Pourquoi il n'y a rien à afficher.
 *
 * Les deux causes n'appellent pas la même action, et les confondre laisserait
 * le manager attendre une donnée qui ne viendra pas : il manque des rendez-vous
 * coachés à cette personne, ou il manque quelqu'un à qui la comparer.
 */
function titreAbsence(skillMeetings: number): string {
  return skillMeetings === 0
    ? "Aucun rendez-vous coaché sur la période : les six compétences du commercial se notent pendant l'analyse d'un rendez-vous."
    : "Personne d'autre n'est coaché sur la période : un profil se lit par rapport au reste de l'équipe, et cette comparaison n'a pas encore de second terme.";
}

/** Les deux compétences, sur deux lignes, à la taille d'une cellule de tableau. */
export function SkillSignatureCell({
  signature,
  skillMeetings,
}: {
  signature: SellerSkillSignature | null;
  skillMeetings: number;
}) {
  if (!signature) {
    return (
      <span
        className="text-zinc-500 dark:text-zinc-400"
        title={titreAbsence(skillMeetings)}
      >
        {VALEUR_NON_CALCULABLE}
      </span>
    );
  }

  return (
    <span
      className="flex min-w-0 flex-col gap-0.5"
      title={titreComparaison(skillMeetings)}
    >
      {/*
        Les deux lignes s'enroulent au lieu de se couper. Une compétence
        tronquée « Lien de confiance … » ne dit plus laquelle travailler, et
        c'est précisément le mot que le manager est venu lire ; les autres
        colonnes du tableau passent déjà à la ligne.
      */}
      <span className="text-zinc-900 dark:text-zinc-100">
        {SELLER_SKILL_LABEL_FR[signature.fort]}{" "}
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatEcartCompetence(signature.ecartFort)}
        </span>
      </span>
      <span className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
        à travailler : {SELLER_SKILL_LABEL_FR[signature.faible]}{" "}
        <span className="tabular-nums">
          {formatEcartCompetence(signature.ecartFaible)}
        </span>
      </span>
    </span>
  );
}

/** Les deux mêmes compétences, en pastilles, sous le nom d'une fiche. */
export function SkillSignatureBadges({
  signature,
  skillMeetings,
  className,
}: {
  signature: SellerSkillSignature | null;
  skillMeetings: number;
  className?: string;
}) {
  if (!signature) {
    return (
      <Badge
        variant="outline"
        className={`text-muted-foreground px-2.5 py-0.5 text-xs font-normal ${className ?? ""}`}
        title={titreAbsence(skillMeetings)}
      >
        Profil · {VALEUR_NON_CALCULABLE}
      </Badge>
    );
  }

  return (
    <span
      className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}
      title={titreComparaison(skillMeetings)}
    >
      <Badge
        variant="secondary"
        className="px-2.5 py-0.5 text-xs font-medium"
        title="Sa compétence la plus au-dessus de la moyenne de son équipe."
      >
        Point fort · {SELLER_SKILL_LABEL_FR[signature.fort]}{" "}
        <span className="tabular-nums">
          {formatEcartCompetence(signature.ecartFort)}
        </span>
      </Badge>
      <Badge
        variant="outline"
        className="text-muted-foreground px-2.5 py-0.5 text-xs font-normal"
        title="Sa compétence la plus au-dessous de la moyenne de son équipe."
      >
        À travailler · {SELLER_SKILL_LABEL_FR[signature.faible]}{" "}
        <span className="tabular-nums">
          {formatEcartCompetence(signature.ecartFaible)}
        </span>
      </Badge>
    </span>
  );
}
