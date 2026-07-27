/**
 * Ce que veulent dire DISC, SONCAS et KISS, dit une seule fois, au point d'usage.
 *
 * L'application affichait « Influent 38 % » ou « Sécurité 31 % » sans jamais
 * dire ce qu'est un profil Influent ni ce que le levier Sécurité recouvre. Qui
 * ne connaît pas ces grilles ne lit qu'un pourcentage sur un mot opaque. Ce
 * module porte l'explication, et il la porte au bon endroit : non pas ce que le
 * mot signifie en théorie, mais ce qu'un commercial en fait en rendez-vous. Un
 * référentiel qui ne dirait pas comment s'adapter serait un dictionnaire, pas un
 * outil de vente.
 *
 * Le fichier est pur et sans balise : c'est le composant `TermeDeGrille` qui
 * l'affiche. Deux raisons. La première, un même profil est nommé à plusieurs
 * endroits (barres de la fiche, légendes des camemberts du manager), et une
 * seule source garantit qu'il y dit partout la même chose. La seconde, Jest ne
 * rend aucun composant ici, mais il relit ce texte : les invariants de contenu
 * (chaque profil a son geste, aucun n'est vide) sont donc testés pour de vrai.
 */

/** Un profil d'une grille : ce qu'il est, et le geste commercial qu'il appelle. */
export type ProfilDeGrille = {
  /** La clé interne, celle des barres et des parts de camembert (« D », « securite »). */
  readonly code: string;
  /** La lettre de l'acronyme, pour la pastille (« D », « S »). */
  readonly lettre: string;
  /** Le nom lu à l'écran (« Dominant », « Sécurité »). */
  readonly nom: string;
  /** Ce que c'est, en une phrase, sans jargon. */
  readonly resume: string;
  /** Le geste concret : comment s'y adapter, ou comment activer ce levier. */
  readonly enRendezVous: string;
};

export type GrilleCommerciale = {
  readonly cle: "disc" | "soncas";
  readonly nom: string;
  /** L'acronyme épelé, pour l'en-tête du guide (« Dominant, Influent, Stable, Conforme »). */
  readonly acronyme: string;
  /** Ce que la grille sert, en une phrase. */
  readonly intro: string;
  readonly profils: readonly ProfilDeGrille[];
};

/**
 * DISC : quatre styles de communication chez l'interlocuteur.
 *
 * Le geste de chaque profil dit d'abord ce que la personne attend, puis
 * l'erreur qui la fait décrocher : c'est là que le commercial gagne ou perd le
 * rendez-vous, pas dans la définition.
 */
export const GRILLE_DISC: GrilleCommerciale = {
  cle: "disc",
  nom: "DISC",
  acronyme: "Dominant, Influent, Stable, Conforme",
  intro:
    "Le DISC décrit quatre styles de communication chez vos interlocuteurs. Repérer le style de la personne en face vous dit comment lui parler pour qu'elle vous entende.",
  profils: [
    {
      code: "D",
      lettre: "D",
      nom: "Dominant",
      resume:
        "Va droit au but, veut des résultats et décide vite. Supporte mal les détours et le contexte long.",
      enRendezVous:
        "Annoncez le résultat et le bénéfice chiffré d'abord, laissez-lui la décision finale, gardez le raisonnement pour après. Le noyer de contexte avant le chiffre, c'est le perdre.",
    },
    {
      code: "I",
      lettre: "I",
      nom: "Influent",
      resume:
        "Aime l'échange, se décide à la relation et à l'enthousiasme. Craint l'ennui et les tableaux de chiffres.",
      enRendezVous:
        "Laissez-le parler, reformulez ses idées, appuyez-vous sur des références et des histoires plutôt que sur un tableur. Une démonstration trop technique éteint son élan.",
    },
    {
      code: "S",
      lettre: "S",
      nom: "Stable",
      resume:
        "Cherche la sécurité et l'harmonie, avance par étapes. Se méfie du changement brusque et de la pression.",
      enRendezVous:
        "Rassurez sur l'accompagnement, avancez pas à pas, donnez-lui le temps de décider. Forcer la signature dans le rendez-vous le fait se refermer.",
    },
    {
      code: "C",
      lettre: "C",
      nom: "Conforme",
      resume:
        "Veut des preuves, de la précision et de la méthode. Déteste l'approximation et la survente.",
      enRendezVous:
        "Apportez des données, des garanties et un cadre écrit, répondez précisément à chaque objection. Une promesse ronde sans preuve le fait douter de tout le reste.",
    },
  ],
};

/**
 * SONCAS : six motivations qui déclenchent un achat.
 *
 * Le geste de chaque levier dit comment l'activer : ce sont des verbes
 * d'action, parce qu'un levier qu'on nomme sans savoir l'actionner ne fait pas
 * avancer la vente.
 */
export const GRILLE_SONCAS: GrilleCommerciale = {
  cle: "soncas",
  nom: "SONCAS",
  acronyme: "Sécurité, Orgueil, Nouveauté, Confort, Argent, Sympathie",
  intro:
    "SONCAS décrit six motivations qui déclenchent un achat. Trouver le levier de votre interlocuteur, c'est parler à ce qui le décide vraiment, pas à ce qui vous semble important à vous.",
  profils: [
    {
      code: "securite",
      lettre: "S",
      nom: "Sécurité",
      resume:
        "Besoin d'être rassuré et de limiter le risque avant de s'engager.",
      enRendezVous:
        "Activez-le avec des références clients, des garanties, la réversibilité et des preuves concrètes. C'est le levier de qui a déjà été déçu par un fournisseur.",
    },
    {
      code: "orgueil",
      lettre: "O",
      nom: "Orgueil",
      resume:
        "Besoin de reconnaissance, de statut, d'être en avance sur les autres.",
      enRendezVous:
        "Activez-le en montrant ce que ce choix dit de lui : exclusivité, image, position de pionnier. Valorisez la personne, pas seulement le produit.",
    },
    {
      code: "nouveaute",
      lettre: "N",
      nom: "Nouveauté",
      resume:
        "Attiré par l'innovation, la modernité, ce qui sort de l'ordinaire.",
      enRendezVous:
        "Activez-le en mettant en avant ce qui est nouveau et l'avance que cela lui donne. Un discours « comme tout le monde » le laisse froid.",
    },
    {
      code: "confort",
      lettre: "C",
      nom: "Confort",
      resume:
        "Recherche la simplicité et la tranquillité, veut se libérer d'une charge.",
      enRendezVous:
        "Activez-le en montrant la facilité de mise en place, le temps gagné, le « rien à gérer ». Tout ce qui ressemble à un chantier le refroidit.",
    },
    {
      code: "argent",
      lettre: "A",
      nom: "Argent",
      resume:
        "Sensible au prix, au retour sur investissement, au coût de la décision.",
      enRendezVous:
        "Activez-le en chiffrant le gain et le coût de l'inaction, pas en baissant le prix. Faites-lui écrire ce que son problème lui coûte aujourd'hui.",
    },
    {
      code: "sympathie",
      lettre: "S",
      nom: "Sympathie",
      resume:
        "Sensible à la relation, à la confiance humaine, à la qualité de l'écoute.",
      enRendezVous:
        "Activez-le par l'écoute, la proximité et des engagements tenus dans la durée. Ici la relation passe avant l'argumentaire.",
    },
  ],
};

export const GRILLES: Record<GrilleCommerciale["cle"], GrilleCommerciale> = {
  disc: GRILLE_DISC,
  soncas: GRILLE_SONCAS,
};

/** Le profil d'une grille par sa clé interne, ou `null` si la clé est inconnue. */
export function profilDeLaGrille(
  grille: GrilleCommerciale,
  code: string,
): ProfilDeGrille | null {
  return grille.profils.find((p) => p.code === code) ?? null;
}

/** Une case KISS : ce que la colonne trie, en une phrase. */
export type QuadrantKiss = {
  readonly cle: "keep" | "improve" | "stop" | "start";
  readonly nom: string;
  readonly resume: string;
};

/**
 * KISS : les quatre gestes du coaching, expliqués une fois.
 *
 * Les titres restent en anglais parce que c'est le nom de la méthode ; le résumé
 * dit en français ce que chaque colonne trie, pour qui la découvre.
 */
export const GRILLE_KISS = {
  intro:
    "KISS trie le coaching en quatre gestes : garder ce qui marche, affiner ce qui est presque là, arrêter ce qui coûte, lancer ce qui manque.",
  quadrants: [
    {
      cle: "keep" as const,
      nom: "Keep",
      resume: "Ce qui marche déjà : à répéter tel quel, sans y toucher.",
    },
    {
      cle: "improve" as const,
      nom: "Improve",
      resume: "Ce qui est là mais gagnerait à être affiné d'un cran.",
    },
    {
      cle: "start" as const,
      nom: "Start",
      resume: "Ce qui manque encore : un réflexe à installer.",
    },
    {
      cle: "stop" as const,
      nom: "Stop",
      resume: "Ce qui coûte des rendez-vous : à couper.",
    },
  ],
} satisfies {
  intro: string;
  quadrants: readonly QuadrantKiss[];
};
