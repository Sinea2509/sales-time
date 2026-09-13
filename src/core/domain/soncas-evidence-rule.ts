import {
  soncasResultSchema,
  type SoncasAnalysisResult,
} from "./analysis-result-zod";
import { PROFILE_SCORE_UNPROVEN_MAX } from "./profile-score-scale";

/**
 * « Pas de preuve, pas de note » : la règle appliquée par le produit.
 *
 * La consigne demande au modèle d'appuyer chaque levier sur les mots du
 * prospect. Une consigne n'est pas une garantie : le jour où le modèle rend un
 * levier à 80 avec une liste `evidence` vide, ce 80 entre dans la moyenne qui
 * devient le SalesScore du rendez-vous, puis dans les moyennes du commercial et
 * dans le classement de l'équipe. Personne ne peut plus le retrouver ensuite,
 * parce que rien, dans la fiche, ne distingue un 80 tenu par trois citations
 * d'un 80 tenu par rien.
 *
 * Le levier est donc ramené dans la première tranche, celle qui se lit « rien
 * qu'on puisse citer ». Il n'est pas mis à zéro : on sait que la preuve manque,
 * on ne sait pas que le levier est absent, et l'écrire à zéro affirmerait plus
 * que ce qu'on a constaté.
 *
 * Rien d'équivalent pour DISC, et ce n'est pas un oubli : son schéma porte une
 * seule liste `evidence` pour les quatre styles, si bien qu'aucune preuve n'est
 * rattachable à un score en particulier. Une règle automatique y jetterait les
 * quatre notes dès que la liste est vide, ou n'en jetterait aucune : les deux
 * sont faux. DISC s'en remet à sa consigne, et le dit dans
 * `profile-score-scale.ts`.
 *
 * La correction s'applique à l'écriture, avant l'enregistrement, jamais à la
 * lecture. Une analyse déjà en base garde ce qu'elle annonçait le jour où elle a
 * été produite, comme la scorecard garde sa grille.
 */

type SoncasDrivers = SoncasAnalysisResult["drivers"];
type SoncasDriverKey = keyof SoncasDrivers;
type SoncasDriverBlock = SoncasDrivers[SoncasDriverKey];

/**
 * Les six leviers, demandés au schéma plutôt que recopiés.
 *
 * Une liste recopiée ici vivrait sa vie : un levier ajouté au schéma serait
 * simplement sauté par la règle, sans que rien ne le signale. L'ordre est celui
 * de la déclaration, c'est-à-dire l'ordre de l'acronyme SONCAS, et il sert de
 * départage quand deux leviers se retrouvent à la même note.
 */
const LEVIERS_SONCAS = Object.keys(
  soncasResultSchema.shape.drivers.shape,
) as SoncasDriverKey[];

/** Une preuve, c'est au moins un extrait qui ne soit pas que des espaces. */
function porteUnePreuve(evidence: readonly string[]): boolean {
  return evidence.some((extrait) => extrait.trim().length > 0);
}

/**
 * Ramène dans la première tranche tout levier noté au-dessus sans preuve.
 *
 * Rend l'entrée telle quelle si elle n'est pas un résultat SONCAS lisible, et
 * telle quelle aussi si aucun levier n'était à corriger : un résultat déjà
 * conforme ressort donc identique, sans copie intermédiaire, et un appelant peut
 * comparer les deux références pour savoir si quelque chose a bougé.
 *
 * Le levier dominant est recalculé quand une note a bougé, faute de quoi la
 * fiche annoncerait « dominant : Argent » sous un Argent tombé à 19 pendant
 * qu'un autre levier culmine à 70. Il ne l'est pas quand rien n'a bougé : un
 * dominant qui n'était déjà pas le maximum est une incohérence du modèle, pas
 * une conséquence de cette règle, et la corriger ici donnerait à cette fonction
 * un second métier que son nom ne dit pas.
 *
 * Le résultat rendu est celui que le schéma de lecture reconnaît. Aucun champ
 * n'est perdu au passage : ce schéma est la base dont dérive le schéma de
 * génération, il connaît donc tout ce que le modèle a le droit de produire.
 */
export function applySoncasEvidenceRule(result: unknown): unknown {
  const parsed = soncasResultSchema.safeParse(result);
  if (!parsed.success) return result;

  const drivers: Record<SoncasDriverKey, SoncasDriverBlock> = {
    ...parsed.data.drivers,
  };
  let uneNoteABaisse = false;

  for (const cle of LEVIERS_SONCAS) {
    const levier = drivers[cle];
    if (porteUnePreuve(levier.evidence)) continue;
    if (levier.score <= PROFILE_SCORE_UNPROVEN_MAX) continue;
    drivers[cle] = { ...levier, score: PROFILE_SCORE_UNPROVEN_MAX };
    uneNoteABaisse = true;
  }

  if (!uneNoteABaisse) return result;

  /*
    Comparaison stricte, et le dominant annoncé par le modèle comme point de
    départ : un levier qui l'égale ne le déplace donc pas. Rien ne permettrait de
    préférer l'un à l'autre, et le modèle a lu le compte rendu, pas nous.

    Une comparaison large ferait autre chose que « le dernier à égalité
    gagne » : elle ferait « le dernier à égalité dans l'ordre de l'acronyme
    gagne », un départage qui n'a aucun sens commercial et qui, pour un dominant
    annoncé tôt dans SONCAS, se lit comme une note recalculée sans raison
    visible.
  */
  const dominant = LEVIERS_SONCAS.reduce(
    (retenu, cle) =>
      drivers[cle].score > drivers[retenu].score ? cle : retenu,
    parsed.data.dominant,
  );

  return { ...parsed.data, drivers, dominant };
}
