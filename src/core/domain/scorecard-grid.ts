/**
 * La grille d'un rendez-vous : ses blocs, ses critères et leur poids.
 *
 * Une scorecard n'est pas un texte, c'est une donnée. Le prompt envoyé au
 * modèle, le schéma de sortie qu'on lui impose, le calcul du score et les
 * libellés affichés au commercial se déduisent tous de l'objet décrit ici. Un
 * critère ajouté à cet endroit apparaît partout à la fois ; un critère ajouté
 * dans le prompt seul produirait une note que le schéma refuse, et un critère
 * ajouté dans le schéma seul produirait un champ que le modèle ne sait pas
 * remplir. C'est exactement la dérive que ce fichier existe pour empêcher.
 *
 * C'est aussi ce qui rend le rendez-vous de closing bon marché : une seconde
 * grille, pas une seconde implémentation. On n'attend pas la même chose d'une
 * découverte et d'un closing, mais on les mesure de la même façon.
 *
 * Les noms de champs sont anglais, les valeurs françaises. Ces champs voyagent
 * jusqu'au schéma JSON imposé au modèle et jusqu'à la ligne enregistrée en
 * base, où tout le reste du produit parle déjà anglais ; le contenu, lui, est
 * lu par un commercial francophone et par personne d'autre.
 */

/** Niveau maximal d'un critère. Cinq niveaux, de 0 à 4. */
export const SCORECARD_LEVEL_MAX = 4;

/**
 * Somme imposée aux poids des blocs d'une grille.
 *
 * Le score d'une scorecard se lit sur la même échelle que le SalesScore et que
 * toutes les notes du produit. Une grille dont les poids sommeraient à 90
 * rendrait « Excellence » inatteignable sans que rien ne le signale.
 */
export const SCORECARD_TOTAL = 100;

/** Un critère de la grille : ce que le commercial devait obtenir. */
export type ScorecardCriterion = {
  /** Clé courte, préfixée par celle du bloc : « A1 », « B3 ». */
  readonly key: string;
  /** Intitulé affiché au commercial. */
  readonly label: string;
  /**
   * Ce qu'il faut avoir obtenu pour mériter le niveau maximal.
   *
   * Sans cette phrase, « creusé » veut dire ce que le modèle décide qu'il veut
   * dire, et il en décide autrement d'un rendez-vous à l'autre.
   */
  readonly expected: string;
  /**
   * Le thème à chercher dans tout le rendez-vous, quelle que soit la façon
   * dont la question a été posée. C'est ce qui permet de noter un commercial
   * qui ne récite pas un script : la revue du 5 octobre a montré des critères
   * notés 0 alors que le sujet avait été traité avec d'autres mots.
   */
  readonly lookFor?: string;
  /**
   * Des façons de poser la question, données en exemple et jamais exigées :
   * une autre formulation compte pleinement. Elles aident le modèle à
   * reconnaître le geste, pas à le réclamer mot pour mot.
   */
  readonly examples?: readonly string[];
  /**
   * Vrai quand le produit fixe lui-même le niveau de ce critère à partir d'une
   * mesure (la répartition de la parole pour l'écoute).
   */
  readonly measuredByProduct?: boolean;
  /**
   * Vrai quand le transcript peut ne pas montrer le moment que le critère
   * juge (l'ouverture du rendez-vous, quand l'enregistrement a commencé
   * après) : le critère sort alors du calcul au lieu de coûter des points.
   */
  readonly canBeUnobservable?: boolean;
  /** Vrai quand le niveau 4 exige un chiffre donné par le prospect. */
  readonly requiresFigure?: boolean;
};

/** Un bloc de la grille : une famille de critères et son poids. */
export type ScorecardBlock = {
  /** Lettre du bloc : « A », « B ». */
  readonly key: string;
  /** Nom affiché du bloc. */
  readonly name: string;
  /** Points sur 100 que ce bloc peut rapporter. */
  readonly weight: number;
  readonly criteria: readonly ScorecardCriterion[];
};

/** Identifiant d'une grille. Le closing viendra s'ajouter ici. */
export type ScorecardGridId = "DECOUVERTE" | "DECOUVERTE_V2";

export type ScorecardGrid = {
  readonly id: ScorecardGridId;
  /** Nom affiché de la grille. */
  readonly name: string;
  /** Ce que ce type de rendez-vous doit produire, en une phrase. */
  readonly intent: string;
  /**
   * Ce qui n'est pas attendu dans ce type de rendez-vous, et ne doit donc
   * jamais être compté comme un manque ni suggéré comme une amélioration.
   */
  readonly notExpected?: string;
  readonly blocks: readonly ScorecardBlock[];
};

/**
 * La grille du rendez-vous de découverte.
 *
 * Vingt-cinq critères sans jargon maison : ils valent pour un éditeur de
 * logiciel comme pour un cabinet de conseil, parce que le produit est vendu à
 * des organisations dont on ne connaît pas le métier. Ce qu'une organisation a
 * de particulier arrive par son playbook, qui pondère les conseils sans jamais
 * toucher aux règles de notation.
 *
 * Les poids valent quatre fois le nombre de critères du bloc, si bien que le
 * score d'un bloc est exactement la somme de ses niveaux : aucune règle de
 * trois, aucun arrondi, rien à vérifier. La mécanique de calcul accepte
 * d'autres poids, et la grille de closing s'en servira sans doute ; celle-ci
 * n'en a pas besoin.
 */
export const DECOUVERTE_GRID: ScorecardGrid = {
  id: "DECOUVERTE",
  name: "Rendez-vous de découverte",
  intent:
    "Comprendre la situation du prospect, sa douleur, son processus de décision et repartir avec une suite datée.",
  blocks: [
    {
      key: "A",
      name: "Contexte et compte",
      weight: 20,
      criteria: [
        {
          key: "A1",
          label: "Taille et effectif",
          expected:
            "Un ordre de grandeur chiffré de l'entreprise ou de l'équipe concernée, obtenu du prospect.",
        },
        {
          key: "A2",
          label: "Organisation et parties prenantes",
          expected:
            "Qui fait quoi autour du sujet, nommément, et qui sera touché par le changement.",
        },
        {
          key: "A3",
          label: "Secteur et contexte business",
          expected:
            "Le marché du prospect, sa dynamique et ce qui pèse dessus en ce moment.",
        },
        {
          key: "A4",
          label: "Existant et solution actuelle",
          expected:
            "Comment le prospect fait aujourd'hui, avec quels outils, et ce qui marche ou non dedans.",
        },
        {
          key: "A5",
          label: "Enjeux stratégiques",
          expected:
            "Les priorités de l'entreprise sur l'année et le lien entre ce sujet et l'une d'elles.",
        },
      ],
    },
    {
      key: "B",
      name: "Besoin et douleur",
      weight: 32,
      criteria: [
        {
          key: "B1",
          label: "Déclencheur",
          expected:
            "Ce qui fait que le prospect s'en occupe maintenant plutôt qu'il y a six mois.",
        },
        {
          key: "B2",
          label: "Problème précis",
          expected:
            "Le problème formulé par le prospect en ses termes, avec un exemple concret vécu.",
        },
        {
          key: "B3",
          label: "Impact et coût de l'inaction",
          requiresFigure: true,
          expected:
            "Ce que le problème coûte, en temps, en argent ou en risque, chiffré par le prospect, et ce qui arrive si rien ne bouge. Sans chiffre dit par le prospect, pas de niveau 4.",
        },
        {
          key: "B4",
          label: "Objectifs et critères de succès",
          expected:
            "À quoi le prospect reconnaîtra que c'est réussi, si possible avec un chiffre et une échéance.",
        },
        {
          key: "B5",
          label: "Périmètre et volumétrie",
          expected:
            "Qui est concerné, combien, sur quels sites ou quels dossiers, et pour quel usage réel.",
        },
        {
          key: "B6",
          label: "Historique des tentatives",
          expected:
            "Ce qui a déjà été essayé, avec qui, et pourquoi cela n'a pas suffi.",
        },
        {
          key: "B7",
          label: "Contraintes",
          expected:
            "Les limites imposées : délais, sécurité, technique, réglementation, ressources internes.",
        },
        {
          key: "B8",
          label: "Bénéfice attendu",
          expected:
            "Ce que le prospect espère y gagner, dit par lui, et non ce que le commercial lui promet.",
        },
      ],
    },
    {
      key: "C",
      name: "Décision",
      weight: 24,
      criteria: [
        {
          key: "C1",
          label: "Décideur économique",
          expected: "Qui signe, nommément, et quel est son rapport au sujet.",
        },
        {
          key: "C2",
          label: "Circuit de validation",
          expected:
            "Les étapes entre aujourd'hui et la signature, et qui intervient à chacune.",
        },
        {
          key: "C3",
          label: "Budget",
          expected:
            "Un montant ou une fourchette, l'existence d'une enveloppe et à qui elle appartient.",
        },
        {
          key: "C4",
          label: "Calendrier de décision",
          expected: "La date visée pour décider et ce qui la commande.",
        },
        {
          key: "C5",
          label: "Concurrence et alternatives",
          expected:
            "Qui d'autre est consulté, y compris l'option de ne rien faire, et sur quels critères on comparera.",
        },
        {
          key: "C6",
          label: "Freins et risques",
          expected:
            "Ce qui pourrait faire échouer le projet en interne, dit par le prospect et non deviné.",
        },
      ],
    },
    {
      key: "D",
      name: "Suite et engagement",
      weight: 12,
      criteria: [
        {
          key: "D1",
          label: "Prochaine étape planifiée",
          expected:
            "Une date ferme posée pendant le rendez-vous, pas un « je vous recontacte ».",
        },
        {
          key: "D2",
          label: "Engagement mutuel",
          expected:
            "Une action prise par le prospect lui-même, avec un délai, en plus de celles du commercial.",
        },
        {
          key: "D3",
          label: "Livrables annoncés",
          expected:
            "Ce que le commercial enverra, quand, et en quoi cela sert la décision du prospect.",
        },
      ],
    },
    {
      key: "E",
      name: "Posture et exécution",
      weight: 12,
      criteria: [
        {
          key: "E1",
          label: "Ratio d'écoute",
          expected:
            "Le prospect parle nettement plus que le commercial sur l'ensemble du rendez-vous.",
        },
        {
          key: "E2",
          label: "Qualité du questionnement",
          expected:
            "Des questions ouvertes, des relances sur les réponses vagues, des silences tenus.",
        },
        {
          key: "E3",
          label: "Personnalisation et valeur",
          expected:
            "Un discours branché sur ce que le prospect vient de dire, jamais un argumentaire déroulé tel quel.",
        },
      ],
    },
  ],
};

/**
 * La grille du rendez-vous de découverte, deuxième version (revue du
 * 5 octobre 2026).
 *
 * Trois changements par rapport à la première :
 * - chaque critère dit le thème à chercher dans tout le rendez-vous et donne
 *   des formulations en exemple, jamais exigées : un commercial qui pose la
 *   bonne question avec ses mots à lui obtient ses points ;
 * - « Cadrage et prise de lead » entre dans la posture, à la demande de
 *   Cédric : la façon d'ouvrir le rendez-vous n'était notée nulle part ;
 * - « Bénéfice attendu » rejoint « Objectifs et critères de succès », qu'il
 *   recouvrait, pour que les poids restent à 100.
 *
 * Les poids valent toujours quatre fois le nombre de critères du bloc : un
 * niveau vaut un point.
 */
export const DECOUVERTE_V2_GRID: ScorecardGrid = {
  id: "DECOUVERTE_V2",
  name: "Rendez-vous de découverte",
  intent:
    "Comprendre la situation du prospect, son besoin, la façon dont il décide et repartir avec une suite engagée des deux côtés.",
  notExpected:
    "Un rendez-vous de découverte ne présente pas encore de programme détaillé, de proposition chiffrée ni de comparatif de prix avec d'autres prestataires : c'est l'objet du rendez-vous suivant. Ne le compte jamais comme un manque et ne le suggère jamais comme une amélioration. Répondre à une question de prix par un ordre de grandeur, puis renvoyer le détail au rendez-vous de proposition, est un bon geste.",
  blocks: [
    {
      key: "A",
      name: "Contexte et compte",
      weight: 20,
      criteria: [
        {
          key: "A1",
          label: "Taille et organisation du compte",
          requiresFigure: true,
          expected:
            "Des ordres de grandeur chiffrés obtenus du prospect : effectif, nombre de sociétés, de sites ou d'équipes concernés. Sans chiffre dit par le prospect, pas de niveau 4.",
          lookFor:
            "Tout ce qui situe la taille du compte : effectifs, nombre de sociétés ou d'entités, de sites, de managers, d'équipes.",
          examples: [
            "Vous êtes combien aujourd'hui ?",
            "Ça représente combien de managers chez vous ?",
          ],
        },
        {
          key: "A2",
          label: "Interlocuteurs et parties prenantes",
          expected:
            "Qui fait quoi autour du sujet, nommément : le rôle de l'interlocuteur, sa hiérarchie, les autres personnes concernées.",
          lookFor:
            "Le rôle de la personne en face, à qui elle rend compte, et les autres personnes qui interviennent sur le sujet, nommées.",
          examples: [
            "Quel est votre rôle sur ce sujet ?",
            "Avec qui travaillez-vous sur ces questions ?",
          ],
        },
        {
          key: "A3",
          label: "Contexte et actualité de l'entreprise",
          expected:
            "Ce qui se passe en ce moment dans l'entreprise et pèse sur le sujet : activité, période chargée, changements en cours.",
          lookFor:
            "Le marché, l'actualité, la charge du moment, une réorganisation, une croissance : ce qui donne le cadre du rendez-vous.",
          examples: ["Comment se passe l'année pour vous ?"],
        },
        {
          key: "A4",
          label: "Existant et façon de faire actuelle",
          expected:
            "Comment le prospect fait aujourd'hui, en interne ou avec des prestataires, et ce qui marche ou non dans cette façon de faire.",
          lookFor:
            "Ce qui existe déjà : dispositifs, outils, équipes internes, programmes en place, prestataires actuels, et le jugement du prospect dessus.",
          examples: [
            "Qu'est-ce que vous avez déjà mis en place ?",
            "Comment ça se passe aujourd'hui sur ce sujet ?",
          ],
        },
        {
          key: "A5",
          label: "Enjeux stratégiques",
          expected:
            "Les priorités de l'entreprise ou de la direction, et le lien entre le sujet du rendez-vous et l'une d'elles.",
          lookFor:
            "Ce que la direction veut, la stratégie de l'année, une orientation dite par le prospect (« c'est le souhait de la direction de… »).",
          examples: [
            "Qu'est-ce qui compte le plus pour votre direction cette année ?",
          ],
        },
      ],
    },
    {
      key: "B",
      name: "Besoin et douleur",
      weight: 28,
      criteria: [
        {
          key: "B1",
          label: "Déclencheur",
          expected:
            "Ce qui fait que le prospect s'en occupe maintenant, dit par lui.",
          lookFor:
            "La raison d'agir maintenant : une capacité interne saturée, une demande qui revient, un événement, une échéance.",
          examples: [
            "Qu'est-ce qui fait que vous regardez ce sujet maintenant ?",
            "Pourquoi maintenant plutôt que l'an dernier ?",
          ],
        },
        {
          key: "B2",
          label: "Problème précis",
          expected:
            "Le problème formulé par le prospect en ses termes, avec un exemple concret vécu.",
          lookFor:
            "Un problème décrit concrètement, une situation vécue, un exemple raconté par le prospect.",
          examples: [
            "Vous pouvez me donner un exemple récent ?",
            "Concrètement, ça se passe comment ?",
          ],
        },
        {
          key: "B3",
          label: "Impact et coût de l'inaction",
          expected:
            "Ce que le problème coûte, en temps, en argent ou en risque, et ce qui arrive si rien ne bouge.",
          lookFor:
            "Les conséquences du problème : temps perdu, argent, turn-over, qualité, risque, et ce qui se passe si rien ne change.",
          examples: [
            "Qu'est-ce que ça vous coûte aujourd'hui ?",
            "Et si rien ne change d'ici un an ?",
          ],
        },
        {
          key: "B4",
          label: "Objectifs et critères de succès",
          expected:
            "À quoi le prospect et sa direction reconnaîtront que c'est réussi, ce qu'ils en attendent, si possible avec un chiffre ou un indicateur.",
          lookFor:
            "Ce que le prospect attend du projet, ce que sa direction a besoin de voir (retour sur investissement, indicateurs, satisfaction des collaborateurs), ses critères pour juger une solution.",
          examples: [
            "À quoi verrez-vous que c'est réussi ?",
            "Qu'est-ce que votre direction aura besoin de voir pour dire oui ?",
            "Qu'est-ce qui est important pour vous dans le choix d'un prestataire ?",
          ],
        },
        {
          key: "B5",
          label: "Périmètre et volumétrie",
          requiresFigure: true,
          expected:
            "Qui est concerné, combien, où, sous quel format : de quoi dimensionner une proposition. Sans nombre de personnes, de groupes ou de sessions dit par le prospect, pas de niveau 4.",
          lookFor:
            "Le nombre de personnes ou de groupes concernés, les publics, les sites, les formats et durées possibles, le volume annuel.",
          examples: [
            "Combien de personnes seraient concernées ?",
            "Vous imaginez quel format, et pour quels publics ?",
          ],
        },
        {
          key: "B6",
          label: "Historique des tentatives",
          expected:
            "Ce qui a déjà été essayé, avec qui, et pourquoi cela n'a pas suffi.",
          lookFor:
            "Les solutions ou prestataires déjà essayés, et ce que le prospect en a pensé (déception, limites).",
          examples: [
            "Vous avez déjà travaillé avec des prestataires sur ce sujet ?",
            "Qu'est-ce qui n'a pas marché ?",
          ],
        },
        {
          key: "B7",
          label: "Contraintes",
          expected:
            "Les limites imposées : calendrier, disponibilité des personnes, lieux, formats, règles internes, financement.",
          lookFor:
            "Ce qui limite les options : périodes impossibles, temps disponible des participants, éloignement géographique, formats imposés, règles d'achat.",
          examples: ["Qu'est-ce qui pourrait compliquer la mise en place ?"],
        },
      ],
    },
    {
      key: "C",
      name: "Décision",
      weight: 24,
      criteria: [
        {
          key: "C1",
          label: "Décideur",
          expected:
            "Qui décide et qui signe, nommément, et son rapport au sujet. L'interlocuteur n'est pas le décideur par défaut.",
          lookFor:
            "La personne qui tranche ou valide le budget, nommée par le prospect, et ce qui compte pour elle.",
          examples: [
            "Hormis vous, qui d'autre décidera de travailler ou non avec nous ?",
            "Qui valide ce type de projet chez vous ?",
          ],
        },
        {
          key: "C2",
          label: "Circuit de validation",
          expected:
            "Les étapes entre aujourd'hui et la décision, qui intervient à chacune, et comment le projet sera présenté en interne.",
          lookFor:
            "Comment une décision se prend chez le prospect : les étapes, les personnes, la façon dont le projet se « vend » en interne. Un rendez-vous organisé avec une autre personne qui décide prouve que le sujet a été traité.",
          examples: [
            "Comment ça se passe chez vous pour lancer ce type de projet ?",
            "Qui d'autre faut-il convaincre, et comment ?",
          ],
        },
        {
          key: "C3",
          label: "Budget et prix",
          expected:
            "Un montant ou une fourchette, les prix habituels du prospect, sa réaction au prix annoncé, et qui porte l'enveloppe.",
          lookFor:
            "Tout échange sur l'argent : budget, prix habituels, tarif annoncé par le commercial et réaction du prospect, mode de financement (prise en charge, sous-traitance).",
          examples: [
            "Vous avez un ordre de grandeur en tête ?",
            "Sur quels tarifs travaillez-vous habituellement ?",
          ],
        },
        {
          key: "C4",
          label: "Calendrier de décision",
          expected:
            "Quand la décision se prend et ce qui la commande (cycle budgétaire, période de planification).",
          lookFor:
            "Le moment de la décision et son rythme : cycle annuel, période de planification, échéance interne.",
          examples: ["À quel moment de l'année se décident ces projets ?"],
        },
        {
          key: "C5",
          label: "Concurrence et alternatives",
          expected:
            "Qui d'autre est ou a été consulté, la solution interne, l'option de ne rien faire, et sur quels critères on comparera.",
          lookFor:
            "Les autres prestataires cités, même avec un nom mal transcrit, les ressources internes qui font la même chose, et la comparaison que fera le prospect.",
          examples: [
            "Vous regardez d'autres solutions en parallèle ?",
            "Avec qui travaillez-vous aujourd'hui sur ces sujets ?",
          ],
        },
        {
          key: "C6",
          label: "Freins et risques",
          expected:
            "Ce qui pourrait faire échouer le projet en interne, dit par le prospect.",
          lookFor:
            "Les doutes, priorités concurrentes, réticences de la direction, risques cités par le prospect.",
          examples: [
            "Qu'est-ce qui pourrait faire que ce projet ne se fasse pas ?",
          ],
        },
      ],
    },
    {
      key: "D",
      name: "Suite et engagement",
      weight: 12,
      criteria: [
        {
          key: "D1",
          label: "Prochaine étape planifiée",
          expected:
            "Une date ferme retenue par les deux parties pendant le rendez-vous. Des créneaux proposés à confirmer sont une information partielle.",
          lookFor:
            "Le prochain rendez-vous : date retenue, créneaux proposés, participants prévus, objectif.",
          examples: ["On se cale un moment pour vous présenter tout ça ?"],
        },
        {
          key: "D2",
          label: "Engagement du prospect",
          expected: "Une action prise par le prospect lui-même, avec un délai.",
          lookFor:
            "Ce que le prospect s'engage à faire : en parler à quelqu'un, vérifier un agenda, transmettre un document, revenir vers le commercial d'ici une date.",
          examples: ["Vous pourriez voir avec elle d'ici la fin de semaine ?"],
        },
        {
          key: "D3",
          label: "Livrables annoncés",
          expected:
            "Ce que le commercial s'engage à produire ou envoyer (proposition, support, références), quand, et en quoi cela sert la décision.",
          lookFor:
            "Les engagements du commercial : préparer une proposition, envoyer un support, donner des contacts de clients, avec l'usage pour le prospect.",
          examples: ["Je vous prépare une proposition sur ces deux sujets."],
        },
      ],
    },
    {
      key: "E",
      name: "Posture et exécution",
      weight: 16,
      criteria: [
        {
          key: "E1",
          label: "Ratio d'écoute",
          expected:
            "Le prospect parle nettement plus que le commercial sur l'ensemble du rendez-vous.",
          lookFor: "La part de parole du commercial, mesurée par le produit.",
          measuredByProduct: true,
        },
        {
          key: "E2",
          label: "Qualité du questionnement",
          expected:
            "Des questions ouvertes, des relances sur les réponses vagues, des reformulations, tout au long du rendez-vous.",
          lookFor:
            "Les questions ouvertes (comment, pourquoi, qu'est-ce que, combien…), les relances (« c'est-à-dire ? », « par exemple ? »), les reformulations. Les questions fermées et les questions de vérification (« vous voyez ce que je veux dire ? », « on est d'accord ? ») ne comptent pas : le produit les compte et plafonne le critère quand elles dominent.",
        },
        {
          key: "E3",
          label: "Personnalisation et valeur",
          expected:
            "Un discours branché sur ce que le prospect vient de dire, illustré d'exemples qui lui parlent, jamais un argumentaire déroulé tel quel.",
          lookFor:
            "Les moments où le commercial relie son offre à ce que le prospect vient de dire, avec un exemple ou un cas proche. Un argumentaire déroulé avant que le besoin soit exploré est le contraire : le produit plafonne le critère quand un long passage du commercial arrive dans le premier tiers du rendez-vous.",
        },
        {
          key: "E4",
          label: "Cadrage et prise de lead",
          canBeUnobservable: true,
          expected:
            "En ouverture, le commercial pose l'objectif, le déroulé et la durée du rendez-vous, obtient l'accord du prospect, puis garde la main sur le déroulé.",
          lookFor:
            "Le début du rendez-vous : objectif annoncé, ordre du jour, durée, question pour valider le cadre ; puis les transitions que le commercial mène.",
          examples: [
            "Je vous propose qu'on commence par votre contexte, puis je vous présenterai comment nous travaillons, ça vous va ?",
          ],
        },
      ],
    },
  ],
};

/** Les grilles livrées avec le produit, dans l'ordre d'affichage. */
export const SCORECARD_GRIDS: readonly ScorecardGrid[] = [DECOUVERTE_V2_GRID];

/**
 * Les grilles retirées, gardées pour relire les analyses qu'elles ont
 * produites : une note d'hier garde ses intitulés.
 */
const RETIRED_SCORECARD_GRIDS: readonly ScorecardGrid[] = [DECOUVERTE_GRID];

/** La grille employée quand rien ne permet d'en choisir une autre. */
export const DEFAULT_SCORECARD_GRID: ScorecardGrid = DECOUVERTE_V2_GRID;

/** La grille portant cet identifiant, ou `null` si aucune ne le porte. */
export function scorecardGridById(id: string): ScorecardGrid | null {
  return (
    SCORECARD_GRIDS.find((grid) => grid.id === id) ??
    RETIRED_SCORECARD_GRIDS.find((grid) => grid.id === id) ??
    null
  );
}

/** Tous les critères de la grille, blocs à plat, dans l'ordre. */
export function scorecardCriteria(
  grid: ScorecardGrid,
): readonly ScorecardCriterion[] {
  return grid.blocks.flatMap((block) => block.criteria);
}

/**
 * Ce qui rend une grille inutilisable, ou une liste vide si elle tient debout.
 *
 * Une grille est de la donnée, et de la donnée se saisit : celles livrées ici
 * sont écrites à la main, et une organisation pourra un jour composer la
 * sienne. Les erreurs coûteuses sont silencieuses. Des poids qui ne font pas
 * 100 plafonnent le score sans rien dire ; deux critères qui portent la même
 * clé se recouvrent au moment du calcul et l'un des deux disparaît ; un bloc
 * sans critère divise par zéro. Chacune se voit ici, et un test refuse de
 * livrer une grille qui en porte une.
 */
export function scorecardGridProblems(grid: ScorecardGrid): string[] {
  const problems: string[] = [];
  if (grid.blocks.length === 0) problems.push("grille sans aucun bloc");

  const blockKeys = new Set<string>();
  const criterionKeys = new Set<string>();
  let totalWeight = 0;

  for (const block of grid.blocks) {
    if (blockKeys.has(block.key)) {
      problems.push(`bloc en double : ${block.key}`);
    }
    blockKeys.add(block.key);

    if (!Number.isInteger(block.weight) || block.weight <= 0) {
      problems.push(`poids non entier ou nul pour le bloc ${block.key}`);
    }
    totalWeight += block.weight;

    if (block.criteria.length === 0) {
      problems.push(`bloc sans critère : ${block.key}`);
    }

    for (const criterion of block.criteria) {
      if (criterionKeys.has(criterion.key)) {
        problems.push(`critère en double : ${criterion.key}`);
      }
      criterionKeys.add(criterion.key);
      if (!criterion.key.startsWith(block.key)) {
        problems.push(`critère ${criterion.key} hors de son bloc ${block.key}`);
      }
      if (!criterion.label.trim() || !criterion.expected.trim()) {
        problems.push(`critère incomplet : ${criterion.key}`);
      }
    }
  }

  if (totalWeight !== SCORECARD_TOTAL) {
    problems.push(
      `poids cumulés à ${totalWeight} au lieu de ${SCORECARD_TOTAL}`,
    );
  }

  return problems;
}
