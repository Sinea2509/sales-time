/**
 * Vocabulaire partagé entre les cartes de forfait et le formulaire de demande.
 *
 * Les trois boutons de la page des forfaits ouvraient un brouillon d'e-mail
 * sans destinataire (`mailto:?subject=…`), avec le même objet « Forfait
 * Entreprise » quel que soit le bouton cliqué. Ils mènent désormais au
 * formulaire de la même page, qui enregistre la demande et prévient l'équipe.
 *
 * Le bouton doit donc pouvoir désigner l'option exacte du sélecteur. Les deux
 * listes sortent d'ici : sans cela, un libellé renommé d'un côté ferait échouer
 * la présélection de l'autre, et l'échec serait silencieux, puisque écrire une
 * valeur inconnue dans un `<select>` ne lève rien et ne change rien.
 */
export const ID_FORMULAIRE_DEMANDE = "demande-de-forfait";

/** Identifiant du `<select>`, cible de la présélection depuis les cartes. */
export const ID_CHAMP_FORFAIT_SOUHAITE = "forfait-souhaite";

/**
 * Ordre d'affichage dans le sélecteur, du plus petit forfait au plus grand.
 * Sert aussi de source aux boutons des cartes, d'où le `as const`.
 */
export const FORFAITS_PROPOSES = ["Starter", "Team", "Entreprise"] as const;

export type ForfaitPropose = (typeof FORFAITS_PROPOSES)[number];

/**
 * Forfait proposé quand la demande ne vient pas d'une carte. « Team » est le
 * forfait mis en avant sur la page, et le premier qui ouvre la vue manager.
 */
export const FORFAIT_INITIAL: ForfaitPropose = "Team";

/** Longueur maximale du message, alignée sur la validation côté serveur. */
export const LONGUEUR_MAX_MESSAGE = 2000;
