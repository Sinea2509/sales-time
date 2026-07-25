import { plurielFr } from "@/lib/pluriel-fr";

/**
 * La légende de la matrice des rendez-vous.
 *
 * La matrice ne place qu'un rendez-vous qui porte à la fois une note de
 * qualification et un montant potentiel ; les autres sont écartés en silence
 * au moment de construire les points. La légende, elle, annonçait « sur N rdv »
 * avec un N qui n'était celui de personne : la page équipe lui donnait le
 * nombre de rendez-vous de la période, la fiche d'un commercial lui donnait le
 * nombre de rendez-vous porteurs d'un profil de vente, c'est-à-dire un tout
 * autre décompte. Le lecteur pouvait donc compter douze points sous une légende
 * qui en annonçait vingt, et conclure que le graphique perdait des données sans
 * jamais savoir lesquelles.
 *
 * Elle dit maintenant deux choses : ce que le graphique montre, et ce qu'il ne
 * montre pas.
 */
export function matriceRendezVousLegende({
  pointsPlaces,
  rdvSurLaPeriode,
}: {
  pointsPlaces: number;
  rdvSurLaPeriode: number;
}): string {
  if (rdvSurLaPeriode <= 0) {
    return "Aucun rendez-vous sur la période.";
  }

  if (pointsPlaces <= 0) {
    return rdvSurLaPeriode === 1
      ? "Le rendez-vous de la période n'a pas de note de qualification ou pas de montant potentiel."
      : `Aucun des ${rdvSurLaPeriode} RDV de la période n'a à la fois une note de qualification et un montant potentiel.`;
  }

  /*
    Le nombre d'écartés se calcule ici plutôt que chez l'appelant : c'est la
    seule façon de garantir que les deux nombres de la phrase s'additionnent.
  */
  const ecartes = rdvSurLaPeriode - pointsPlaces;
  if (ecartes <= 0) {
    return rdvSurLaPeriode === 1
      ? "Le seul RDV de la période."
      : `Les ${rdvSurLaPeriode} RDV de la période.`;
  }

  /*
    « sur les 20 de la période » plutôt que « sur 20 » : un nombre nu après
    « sur » se lit comme un dénominateur de note, et une note sur 20 n'existe
    nulle part dans le produit.
  */
  return (
    `${pointsPlaces} RDV ${plurielFr(pointsPlaces, "placé")} sur les ${rdvSurLaPeriode} de la période. ` +
    `${ecartes} ${plurielFr(ecartes, "écarté")}, faute de note de qualification ou de montant potentiel.`
  );
}
