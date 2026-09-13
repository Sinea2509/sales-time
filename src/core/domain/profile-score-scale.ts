/**
 * L'échelle des scores de profil, ancrée sur ce qui s'entend dans l'échange.
 *
 * SONCAS et DISC demandent tous deux des notes de 0 à 100, et aucun des deux ne
 * dit ce que vaut un 60. Un modèle sans repère chiffré pose tout entre 50 et 70,
 * quel que soit le rendez-vous : les six leviers d'un prospect qui n'a parlé que
 * d'argent ressortent presque à égalité, le radar devient un hexagone régulier,
 * et le commercial y lit qu'il n'y a rien à en tirer.
 *
 * Les tranches ne viennent pas de `score-bands.ts`, et c'est une décision. Ce
 * module-là déduit ses bornes des quatre paliers du classement, qui notent le
 * travail d'un commercial : Démarrage, Progression, Maîtrise, Excellence. Un
 * prospect n'est pas « en Démarrage sur la Sécurité ». Ces scores-ci mesurent
 * une intensité observée chez quelqu'un qu'on n'évalue pas, et réutiliser le
 * vocabulaire de la performance ferait lire une note de prospect comme un
 * bulletin.
 *
 * Les tranches sont donc écrites ici, une fois, et partagées par les deux
 * cadres. Ce qui change d'un cadre à l'autre, c'est ce que le produit fait des
 * notes et l'endroit où se rangent les preuves : chaque consigne le dit
 * elle-même.
 */

/** Note maximale d'un score de profil, telle que les deux schémas l'exigent. */
export const PROFILE_SCORE_MAX = 100;

/**
 * Note la plus haute qu'un score puisse garder sans preuve citée.
 *
 * C'est la borne haute de la première tranche, et elle sert deux fois : la
 * consigne y renvoie le modèle quand il ne trouve pas les mots, et
 * `soncas-evidence-rule.ts` y ramène après coup un levier annoncé plus haut sans
 * rien pour l'appuyer. Une seule valeur, pour que la règle annoncée au modèle et
 * celle que le produit applique ne puissent pas diverger.
 */
export const PROFILE_SCORE_UNPROVEN_MAX = 19;

/** Tranche de l'échelle 0 à 100 d'un score de profil, et ce qui la mérite. */
export type ProfileScoreBand = {
  /** Première note de la tranche, incluse. */
  readonly min: number;
  /** Dernière note de la tranche, incluse. */
  readonly max: number;
  /** Nom court de la tranche. Lu par le modèle, jamais affiché. */
  readonly nom: string;
  /** Ce qu'il faut avoir entendu pour y avoir droit. */
  readonly condition: string;
};

/**
 * Les cinq tranches, de l'absence au trait qui traverse tout le rendez-vous.
 *
 * Elles décrivent une quantité de traces dans le compte rendu, pas une qualité :
 * « on l'entend une fois » se vérifie en relisant, « c'est un profil sécuritaire »
 * ne se vérifie pas. La première tranche couvre aussi bien le trait absent que le
 * trait invérifiable, parce que le produit y renvoie les scores sans preuve et
 * qu'affirmer l'absence irait plus loin que ce qu'on sait.
 */
export const PROFILE_SCORE_BANDS: readonly ProfileScoreBand[] = [
  {
    min: 0,
    max: PROFILE_SCORE_UNPROVEN_MAX,
    nom: "absent",
    condition:
      "nothing in the transcript shows it, or nothing you can point to and quote",
  },
  {
    min: 20,
    max: 39,
    nom: "faint",
    condition:
      "one isolated sign, or a sign that could just as well be read another way",
  },
  {
    min: 40,
    max: 59,
    nom: "clear",
    condition:
      "it shows plainly at least once, in the prospect's own words or behaviour",
  },
  {
    min: 60,
    max: 79,
    nom: "marked",
    condition: "it comes back at several distinct moments of the meeting",
  },
  {
    min: 80,
    max: PROFILE_SCORE_MAX,
    nom: "pervasive",
    condition:
      "it runs through the whole meeting and shapes what the prospect asks for and how he asks it",
  },
];

/** Les cinq tranches en liste, telles que les deux consignes les affichent. */
function blocDesTranches(): string {
  return PROFILE_SCORE_BANDS.map(
    (band) => `- ${band.min}–${band.max} ${band.nom}: ${band.condition}`,
  ).join("\n");
}

/**
 * La calibration des six leviers SONCAS, jointe à toute analyse SONCAS.
 *
 * Elle vit avec le contrat non modifiable et non dans la consigne éditable, pour
 * la même raison que l'échelle du `coachingScore` : un super-admin qui réécrit la
 * consigne SONCAS ne doit pas pouvoir faire sauter l'échelle sans le vouloir, et
 * la consigne par défaut n'est de toute façon plus lue dès qu'une version est
 * publiée en base.
 *
 * Le paragraphe sur la moyenne n'est pas une figure de style : le produit fait
 * bien la moyenne des six leviers et l'affiche comme le SalesScore du
 * rendez-vous, voir `dashboard-sales-score.ts`. Le modèle a le droit de savoir ce
 * qu'on fait de ses nombres.
 */
export function soncasScoreScaleInstruction(): string {
  return `## SONCAS driver scores (0–${PROFILE_SCORE_MAX}, calibrated)
These six numbers are not impressions. The product averages them and shows the result as this meeting's score, next to meetings scored by other runs of this prompt, so six numbers placed loosely here end up compared with numbers that were not. Score each driver on how strongly it shows in THIS transcript, against these bands:

${blocDesTranches()}

When you hesitate between two bands, take the lower one. An overstated driver is not a harmless rounding: the seller reads it as the lever to pull at the next meeting, and pulls a lever this prospect never asked for.

No band above the first is free. Before placing a driver above ${PROFILE_SCORE_UNPROVEN_MAX}, find the prospect's own words that carry it and copy 1 to 3 of them into that driver's \`evidence\`, as they were said and in the language of the transcript. Never rewrite a quote and never compose one. A driver you cannot back with words stays in the first band, whatever the meeting felt like, and the product puts it back there if you place it higher with an empty \`evidence\`.

Score the prospect, never the seller. A seller who talks about price for an hour does not make \`argent\` a driver of a prospect who never picked it up.`;
}

/**
 * La calibration des quatre styles DISC, jointe à toute analyse DISC.
 *
 * Même emplacement et même raison que pour SONCAS. Le paragraphe sur les preuves
 * diffère parce que le schéma diffère : DISC porte une seule liste `evidence`
 * pour les quatre styles, là où SONCAS en porte une par levier. On ne peut donc
 * pas rattacher mécaniquement une preuve à un style, et aucune règle produit ne
 * vient rattraper un style annoncé sans appui : ici, la consigne est tout ce
 * qu'il y a.
 */
export function discScoreScaleInstruction(): string {
  return `## DISC style scores (0–${PROFILE_SCORE_MAX}, calibrated)
These four numbers are not impressions. They are drawn side by side on the seller's screen and the strongest one decides the advice he is given, so a style placed one band too high sends him to adapt to a prospect who is not in the room. Score each style on how strongly it shows in THIS transcript, against these bands:

${blocDesTranches()}

The four are independent: they do not share a hundred points, and a meeting can show two styles high or all four low. When you hesitate between two bands, take the lower one.

No band above the first is free. \`evidence\` carries the behaviours and phrases that justify the four numbers: any style you place above ${PROFILE_SCORE_UNPROVEN_MAX} must be traceable to at least one of its bullets, named plainly enough that a reader can tell which score it supports. Never rewrite a quote and never compose one. A style you cannot back that way stays in the first band.

Score the prospect's behaviour, never the seller's.`;
}
