/**
 * Les consignes qu'une organisation peut modifier (Paramètres, Coach IA).
 *
 * Six des onze consignes : celles qui écrivent ce que le commercial lit sur la
 * fiche d'un rendez-vous. Le briefing et les synthèses du manager restent
 * globales, réglées par le super admin pour toutes les organisations, et le
 * modèle d'IA reste choisi par lui.
 *
 * Une consigne d'organisation ne remplace que le rôle et le ton. Les échelles,
 * la grille, la règle de preuve et la règle anti-invention s'ajoutent autour
 * d'elle à chaque analyse, comme autour de la consigne du super admin : un
 * manager ne peut pas les retirer en effaçant un paragraphe.
 */

/** Les six types, dans l'ordre des cartes de l'écran. */
export const ORGANIZATION_PROMPT_KINDS = [
  "SCORECARD",
  "SONCAS",
  "DISC",
  "KISS",
  "MEETING_DETAIL_SYNTHESIS",
  "FOLLOW_UP_EMAIL",
] as const;

export type OrganizationPromptKind = (typeof ORGANIZATION_PROMPT_KINDS)[number];

export function isOrganizationPromptKind(
  kind: string,
): kind is OrganizationPromptKind {
  return (ORGANIZATION_PROMPT_KINDS as readonly string[]).includes(kind);
}

/** Le nom de chaque consigne, tel que l'écran et le journal d'audit l'écrivent. */
export const ORGANIZATION_PROMPT_TITLES: Record<
  OrganizationPromptKind,
  string
> = {
  SCORECARD: "Scorecard, rendez-vous de découverte",
  SONCAS: "SONCAS",
  DISC: "DISC",
  KISS: "KISS",
  MEETING_DETAIL_SYNTHESIS: "Compte rendu de visite",
  FOLLOW_UP_EMAIL: "E-mail de suivi",
};

/**
 * La longueur maximale d'une consigne d'organisation.
 *
 * Les six consignes d'origine font entre 3 500 et 5 000 caractères : 20 000
 * laissent de quoi les enrichir, et bornent ce qu'un copier-coller distrait
 * enverrait au modèle à chaque analyse.
 */
export const ORGANIZATION_PROMPT_MAX_CHARS = 20_000;

export const ORGANIZATION_PROMPT_EMPTY_MESSAGE =
  "La consigne ne peut pas être vide.";

export const ORGANIZATION_PROMPT_TOO_LONG_MESSAGE =
  "La consigne dépasse 20 000 caractères : raccourcissez-la avant de l'enregistrer.";

export type OrganizationPromptTextCheck =
  | { ok: true; markdown: string }
  | { ok: false; message: string };

/**
 * Le texte à enregistrer, ou la raison du refus.
 *
 * Les blancs de début et de fin sont retirés : ils ne changent rien pour le
 * modèle, et une consigne faite de blancs seuls serait une consigne vide qui
 * passerait pour une consigne modifiée.
 */
export function checkOrganizationPromptMarkdown(
  raw: string,
): OrganizationPromptTextCheck {
  const markdown = raw.trim();
  if (!markdown) {
    return { ok: false, message: ORGANIZATION_PROMPT_EMPTY_MESSAGE };
  }
  if (markdown.length > ORGANIZATION_PROMPT_MAX_CHARS) {
    return { ok: false, message: ORGANIZATION_PROMPT_TOO_LONG_MESSAGE };
  }
  return { ok: true, markdown };
}

/** D'où vient la consigne envoyée au modèle. */
export type PromptSource = "organization" | "global" | "code";

/**
 * La règle de résolution, pour une analyse :
 *
 * 1. la consigne de l'organisation, si son dernier enregistrement a un texte ;
 * 2. sinon, la version courante du super admin ;
 * 3. sinon, la consigne du code.
 *
 * Un texte fait de blancs compte comme absent, à chaque étage : il laisserait
 * le modèle sans consigne.
 */
export function pickPromptMarkdown(input: {
  organizationMarkdown: string | null | undefined;
  globalMarkdown: string | null | undefined;
  codeMarkdown: string;
}): { markdown: string; source: PromptSource } {
  if (input.organizationMarkdown?.trim()) {
    return { markdown: input.organizationMarkdown, source: "organization" };
  }
  if (input.globalMarkdown?.trim()) {
    return { markdown: input.globalMarkdown, source: "global" };
  }
  return { markdown: input.codeMarkdown, source: "code" };
}

/**
 * La version inscrite au journal des appels d'IA.
 *
 * Le numéro de la version du super admin, comme avant, ou l'identifiant de la
 * consigne de l'organisation quand c'est elle qui a servi : relire un appel
 * doit dire quel texte le modèle a reçu, et un numéro de version du super
 * admin désignerait un texte qu'il n'a pas reçu.
 */
export function aiLogPromptVersionLabel(input: {
  globalVersion: number;
  organizationPromptVersionId: string | null;
}): string {
  return input.organizationPromptVersionId
    ? `org:${input.organizationPromptVersionId}`
    : String(input.globalVersion);
}
