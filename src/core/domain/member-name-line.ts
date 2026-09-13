/**
 * Le nom sous lequel une personne s'affiche dans l'application.
 *
 * Prénom et nom quand ils sont là, l'adresse e-mail sinon : un compte créé par
 * invitation ne porte longtemps que celle-ci, et une carte muette serait pire
 * qu'une carte qui annonce une adresse. Les blancs de saisie sont retirés avant
 * qu'on en juge, sans quoi un prénom fait d'une seule espace passerait pour un
 * nom et l'écran afficherait une ligne vide.
 *
 * La formule était écrite deux fois, à l'identique, dans le chargeur de la
 * fiche et dans les actions qui la rafraîchissent. Un troisième lecteur arrive,
 * le commercial à qui son portail dit de quelle équipe il est ; trois copies
 * d'une même règle finissent par ne plus dire la même chose.
 */
export function memberNameLine(user: {
  firstName: string | null | undefined;
  lastName: string | null | undefined;
  email: string;
}): string {
  return (
    [user.firstName?.trim() ?? "", user.lastName?.trim() ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim() || user.email
  );
}
