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
export type ScorecardGridId = "DECOUVERTE";

export type ScorecardGrid = {
  readonly id: ScorecardGridId;
  /** Nom affiché de la grille. */
  readonly name: string;
  /** Ce que ce type de rendez-vous doit produire, en une phrase. */
  readonly intent: string;
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
          expected:
            "Ce que le problème coûte, en temps, en argent ou en risque, et ce qui arrive si rien ne bouge.",
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

/** Les grilles livrées avec le produit, dans l'ordre d'affichage. */
export const SCORECARD_GRIDS: readonly ScorecardGrid[] = [DECOUVERTE_GRID];

/** La grille employée quand rien ne permet d'en choisir une autre. */
export const DEFAULT_SCORECARD_GRID: ScorecardGrid = DECOUVERTE_GRID;

/** La grille portant cet identifiant, ou `null` si aucune ne le porte. */
export function scorecardGridById(id: string): ScorecardGrid | null {
  return SCORECARD_GRIDS.find((grid) => grid.id === id) ?? null;
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
