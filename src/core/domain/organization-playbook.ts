import { z } from "zod";

/**
 * Le playbook d'une organisation : ce qu'elle vend, à qui, comment, et ce qui
 * ne se négocie pas.
 *
 * Deux sources alimentent le texte injecté dans les analyses. Les champs
 * ci-dessous, nouveaux, sont saisis sur l'écran Playbook. Le contexte, lui,
 * existait déjà : le nom, le secteur, le cycle de vente, le pitch, les
 * objections fréquentes, les arguments clés et le vocabulaire métier sont
 * demandés à chaque client depuis l'onboarding et n'entraient dans aucun
 * prompt. Le rendu markdown les réunit en un seul bloc, pour que l'IA lise
 * enfin ce que le client a pris la peine de renseigner.
 */

const TEXT_LIMITS = {
  offer: 1500,
  idealCustomer: 1000,
  salesMethod: 2000,
  pricingRules: 1000,
} as const;

const LIST_LIMITS = {
  differentiators: { items: 12, length: 200 },
  competitors: { items: 12, length: 120 },
  qualificationCriteria: { items: 12, length: 200 },
  redLines: { items: 12, length: 200 },
} as const;

export const ORGANIZATION_PLAYBOOK_TEXT_LIMITS = TEXT_LIMITS;
export const ORGANIZATION_PLAYBOOK_LIST_LIMITS = LIST_LIMITS;

const listSchema = (items: number, length: number) =>
  z.array(z.string().max(length)).max(items);

/** Schéma strict : ce qu'une action serveur accepte d'enregistrer. */
export const organizationPlaybookFullFormSchema = z.object({
  offer: z.string().max(TEXT_LIMITS.offer),
  idealCustomer: z.string().max(TEXT_LIMITS.idealCustomer),
  differentiators: listSchema(
    LIST_LIMITS.differentiators.items,
    LIST_LIMITS.differentiators.length,
  ),
  competitors: listSchema(
    LIST_LIMITS.competitors.items,
    LIST_LIMITS.competitors.length,
  ),
  salesMethod: z.string().max(TEXT_LIMITS.salesMethod),
  qualificationCriteria: listSchema(
    LIST_LIMITS.qualificationCriteria.items,
    LIST_LIMITS.qualificationCriteria.length,
  ),
  pricingRules: z.string().max(TEXT_LIMITS.pricingRules),
  redLines: listSchema(LIST_LIMITS.redLines.items, LIST_LIMITS.redLines.length),
});

/**
 * Schéma tolérant : ce qu'on accepte de relire en base.
 *
 * Tout est facultatif. Une colonne JSON écrite par une version précédente du
 * produit ne doit jamais faire tomber une analyse ; au pire elle est ignorée.
 */
export const organizationPlaybookJsonSchema = z.object({
  offer: z.string().max(TEXT_LIMITS.offer).optional(),
  idealCustomer: z.string().max(TEXT_LIMITS.idealCustomer).optional(),
  differentiators: listSchema(
    LIST_LIMITS.differentiators.items,
    LIST_LIMITS.differentiators.length,
  ).optional(),
  competitors: listSchema(
    LIST_LIMITS.competitors.items,
    LIST_LIMITS.competitors.length,
  ).optional(),
  salesMethod: z.string().max(TEXT_LIMITS.salesMethod).optional(),
  qualificationCriteria: listSchema(
    LIST_LIMITS.qualificationCriteria.items,
    LIST_LIMITS.qualificationCriteria.length,
  ).optional(),
  pricingRules: z.string().max(TEXT_LIMITS.pricingRules).optional(),
  redLines: listSchema(
    LIST_LIMITS.redLines.items,
    LIST_LIMITS.redLines.length,
  ).optional(),
});

export type OrganizationPlaybookJson = z.infer<
  typeof organizationPlaybookJsonSchema
>;

export type OrganizationPlaybookForm = {
  offer: string;
  idealCustomer: string;
  differentiators: string[];
  competitors: string[];
  salesMethod: string;
  qualificationCriteria: string[];
  pricingRules: string;
  redLines: string[];
};

export type OrganizationPlaybookTextKey =
  | "offer"
  | "idealCustomer"
  | "salesMethod"
  | "pricingRules";

export type OrganizationPlaybookListKey =
  | "differentiators"
  | "competitors"
  | "qualificationCriteria"
  | "redLines";

const TEXT_KEYS: OrganizationPlaybookTextKey[] = [
  "offer",
  "idealCustomer",
  "salesMethod",
  "pricingRules",
];

const LIST_KEYS: OrganizationPlaybookListKey[] = [
  "differentiators",
  "competitors",
  "qualificationCriteria",
  "redLines",
];

export function emptyOrganizationPlaybookForm(): OrganizationPlaybookForm {
  return {
    offer: "",
    idealCustomer: "",
    differentiators: [],
    competitors: [],
    salesMethod: "",
    qualificationCriteria: [],
    pricingRules: "",
    redLines: [],
  };
}

function cleanList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) out.push(trimmed);
  }
  return out;
}

function readText(
  raw: Record<string, unknown>,
  key: OrganizationPlaybookTextKey,
): string {
  const value = raw[key];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, TEXT_LIMITS[key]).trim();
}

function readList(
  raw: Record<string, unknown>,
  key: OrganizationPlaybookListKey,
): string[] {
  const { items, length } = LIST_LIMITS[key];
  const out: string[] = [];
  for (const value of cleanList(raw[key])) {
    const cut = value.slice(0, length).trim();
    if (cut) out.push(cut);
    if (out.length === items) break;
  }
  return out;
}

/**
 * Normalise le JSON stocké (partiel, voire absent) vers le modèle formulaire.
 *
 * La lecture est tolérante champ par champ, et non d'un bloc. Une validation
 * globale aurait un défaut grave ici : un seul nombre glissé dans une liste
 * ferait échouer l'objet entier, et l'organisation verrait son playbook
 * disparaître silencieusement de toutes ses analyses. Un champ illisible est
 * donc ignoré seul, et les autres passent.
 *
 * La lecture borne aussi les longueurs. Les limites peuvent baisser d'une
 * version à l'autre alors que la colonne, elle, garde ce qui y a été écrit :
 * couper ici garantit que la taille du bloc injecté dans le prompt reste
 * connue, quoi que contienne la base.
 */
export function organizationPlaybookFromJson(
  raw: unknown,
): OrganizationPlaybookForm {
  const base = emptyOrganizationPlaybookForm();
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return base;
  }
  const record = raw as Record<string, unknown>;
  for (const key of TEXT_KEYS) {
    base[key] = readText(record, key);
  }
  for (const key of LIST_KEYS) {
    base[key] = readList(record, key);
  }
  return base;
}

/** Sérialise pour la base : `null` si le playbook est entièrement vide. */
export function organizationPlaybookToJson(
  form: OrganizationPlaybookForm,
): OrganizationPlaybookJson | null {
  const out: OrganizationPlaybookJson = {};
  for (const key of TEXT_KEYS) {
    const value = form[key].trim();
    if (value) out[key] = value;
  }
  for (const key of LIST_KEYS) {
    const values = cleanList(form[key]);
    if (values.length > 0) out[key] = values;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function isOrganizationPlaybookEmpty(
  form: OrganizationPlaybookForm | null,
): boolean {
  return (
    organizationPlaybookToJson(form ?? emptyOrganizationPlaybookForm()) === null
  );
}

/**
 * Les champs de contexte déjà collectés ailleurs dans les réglages.
 *
 * Ils restent stockés dans leurs colonnes d'origine : le playbook les lit, il
 * ne les déplace pas. L'écran Contexte et l'écran Coach IA continuent donc de
 * les éditer, et aucune migration de données n'est nécessaire.
 */
export type OrganizationPlaybookContext = {
  companyName: string;
  industrySector: string;
  commercialTeamSize: string;
  averageSalesCycle: string;
  averageDealSize: string;
  companyPitch: string;
  objections: string[];
  keyArguments: string[];
  industryVocabulary: string;
};

export function emptyOrganizationPlaybookContext(): OrganizationPlaybookContext {
  return {
    companyName: "",
    industrySector: "",
    commercialTeamSize: "",
    averageSalesCycle: "",
    averageDealSize: "",
    companyPitch: "",
    objections: [],
    keyArguments: [],
    industryVocabulary: "",
  };
}

type PlaybookContextRow = {
  companyName?: string | null;
  industrySector?: string | null;
  commercialTeamSize?: string | null;
  averageSalesCycle?: string | null;
  averageDealSize?: string | null;
  companyPitch?: string | null;
  objections?: unknown;
  keyArguments?: unknown;
  industryVocabulary?: string | null;
};

/** Projette une ligne de réglages sur le contexte, sans dépendre de sa forme exacte. */
export function organizationPlaybookContextFromRow(
  row: PlaybookContextRow | null | undefined,
): OrganizationPlaybookContext {
  const base = emptyOrganizationPlaybookContext();
  if (!row) return base;
  return {
    companyName: row.companyName?.trim() ?? "",
    industrySector: row.industrySector?.trim() ?? "",
    commercialTeamSize: row.commercialTeamSize?.trim() ?? "",
    averageSalesCycle: row.averageSalesCycle?.trim() ?? "",
    averageDealSize: row.averageDealSize?.trim() ?? "",
    companyPitch: row.companyPitch?.trim() ?? "",
    objections: cleanList(row.objections),
    keyArguments: cleanList(row.keyArguments),
    industryVocabulary: row.industryVocabulary?.trim() ?? "",
  };
}

const PLAYBOOK_HEADING = "## Playbook de l'organisation";

/**
 * Le préambule dit au modèle quoi faire de ce bloc.
 *
 * Sans lui, un playbook bavard se lit comme une vérité sur le rendez-vous et le
 * modèle finit par noter le commercial sur des arguments qu'il n'a pas
 * prononcés. La règle est donc explicite : ce bloc décrit l'intention de
 * l'entreprise, le transcript décrit ce qui s'est passé, et c'est le transcript
 * qui tranche.
 */
const PLAYBOOK_PREAMBLE =
  "Ce bloc décrit l'entreprise qui vend et la manière dont elle attend qu'on vende. Sers-t'en pour comprendre le contexte, juger la pertinence des arguments employés et repérer les écarts avec la méthode maison. Il ne décrit pas ce rendez-vous : rien ici ne prouve qu'une chose a été dite. En cas de contradiction, le transcript fait foi.";

function textSection(title: string, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return `### ${title}\n\n${trimmed}`;
}

function listSection(title: string, values: string[]): string | null {
  const items = cleanList(values);
  if (items.length === 0) return null;
  return `### ${title}\n\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function identitySection(context: OrganizationPlaybookContext): string | null {
  const rows: [string, string][] = [
    ["Entreprise", context.companyName],
    ["Secteur", context.industrySector],
    ["Taille de l'équipe commerciale", context.commercialTeamSize],
    ["Cycle de vente moyen", context.averageSalesCycle],
    ["Panier moyen", context.averageDealSize],
  ];
  const lines = rows
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => `- ${label} : ${value.trim()}`);
  if (lines.length === 0) return null;
  return `### Identité\n\n${lines.join("\n")}`;
}

/**
 * Le bloc markdown injecté dans les prompts d'analyse.
 *
 * Chaque section disparaît si elle est vide : une organisation qui n'a rempli
 * que son pitch envoie trois lignes, pas un squelette de titres vides que le
 * modèle prendrait pour une information.
 */
export function buildOrganizationPlaybookMarkdown(
  playbook: OrganizationPlaybookForm | null,
  context: OrganizationPlaybookContext | null,
): string {
  const p = playbook ?? emptyOrganizationPlaybookForm();
  const c = context ?? emptyOrganizationPlaybookContext();
  const sections = [
    identitySection(c),
    textSection("Pitch", c.companyPitch),
    textSection("Offre", p.offer),
    textSection("Client idéal", p.idealCustomer),
    listSection("Différenciateurs", p.differentiators),
    listSection("Concurrents fréquemment rencontrés", p.competitors),
    textSection("Méthode de vente attendue", p.salesMethod),
    listSection("Critères de qualification", p.qualificationCriteria),
    listSection("Objections fréquentes", c.objections),
    listSection("Arguments clés", c.keyArguments),
    textSection("Règles de prix et de remise", p.pricingRules),
    listSection("Lignes rouges", p.redLines),
    textSection("Vocabulaire métier", c.industryVocabulary),
  ].filter((section): section is string => section !== null);

  if (sections.length === 0) return "";
  return [PLAYBOOK_HEADING, PLAYBOOK_PREAMBLE, ...sections].join("\n\n");
}
