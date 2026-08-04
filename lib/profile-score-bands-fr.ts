import {
  PROFILE_SCORE_BANDS,
  type ProfileScoreBand,
} from "@/src/core/domain/profile-score-scale";

/*
  Les cinq tranches de l'échelle des scores de profil, dans les mots de
  l'utilisateur.

  Le domaine nomme ses tranches en anglais parce que ces noms s'adressent au
  modèle, jamais à l'écran (voir profile-score-scale.ts). Ici vivent les mêmes
  tranches, côté écran et en français, dérivées des bornes du domaine : si une
  borne bouge là-bas, la légende bouge avec elle, et il n'existe aucun endroit
  où l'échelle affichée pourrait diverger de l'échelle réellement appliquée.

  Sans cette légende, un commercial lit « Sécurité 62 » sans savoir ce que
  vaudrait un 40 ou un 80 : le produit note désormais sur des preuves, autant
  le dire à celui qui lit la note.
*/
const NOMS_FR: Record<string, string> = {
  absent: "absent",
  faint: "ténu",
  clear: "net",
  marked: "marqué",
  pervasive: "omniprésent",
};

export type BandeAfficheeFr = {
  readonly min: number;
  readonly max: number;
  readonly nom: string;
};

export const PROFILE_SCORE_BANDS_FR: readonly BandeAfficheeFr[] =
  PROFILE_SCORE_BANDS.map((band: ProfileScoreBand) => ({
    min: band.min,
    max: band.max,
    nom: NOMS_FR[band.nom] ?? band.nom,
  }));

/** La légende en une ligne : « 0-19 absent, 20-39 ténu, … ». */
export function legendeEchelleProfil(): string {
  return PROFILE_SCORE_BANDS_FR.map(
    (b) => `${b.min}-${b.max} ${b.nom}`,
  ).join(", ");
}

/** La tranche d'une note, pour la nommer à côté du chiffre. */
export function nomDeTranche(score: number): string {
  const bande = PROFILE_SCORE_BANDS_FR.find(
    (b) => score >= b.min && score <= b.max,
  );
  return bande ? bande.nom : "";
}
