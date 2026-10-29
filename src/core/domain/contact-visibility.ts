/**
 * Ce qu'une personne voit des contacts de son organisation.
 *
 * Un manager voit tous les contacts. Un commercial ne voit que ceux qu'il a
 * créés ou déjà rencontrés, pas ceux de ses collègues (retour de Thomas du
 * 29 octobre 2026). La fonction rend l'identifiant du commercial à qui
 * restreindre la vue, ou `undefined` quand rien n'est à restreindre.
 *
 * Un commercial dont l'identifiant manque ne voit rien plutôt que tout : la
 * chaîne vide ne désigne aucun utilisateur.
 */
export function contactsVisibleTo(viewer: {
  internalUserId: string | null | undefined;
  canManageOrganization: boolean;
}): string | undefined {
  if (viewer.canManageOrganization) return undefined;
  return viewer.internalUserId ?? "";
}
