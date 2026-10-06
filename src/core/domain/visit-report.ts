import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "./analysis-result-zod";
import { APP_TIME_ZONE } from "./app-time-zone";
import { evidenceWords, isExcerptInSource } from "./transcript-evidence";
import { scorecardGridById, scorecardCriteria } from "./scorecard-grid";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";
import type { KissAnalysisResult } from "./kiss-result-zod";
import type { ObjectionsAnalysisResult } from "./objections-result-zod";
import { scorecardResultView } from "./scorecard-result-view";
import { scorecardLevelsByKey } from "./scorecard-score";
import type {
  VisitReportExtraction,
  VisitReportParticipant,
  VisitReportQuote,
} from "./visit-report-zod";

/**
 * Le compte rendu de visite, dans la forme validée à la revue du 2 septembre.
 *
 * C'est le texte que le commercial copie dans son CRM. Il assemble trois
 * sources : ce que le modèle a extrait du transcript (participants, thèmes,
 * objections, engagements, suite), ce que les analyses ont déjà établi (profil
 * SONCAS et DISC, grille du rendez-vous) et ce que la base sait du compte
 * (rendez-vous précédents). L'assemblage se fait ici, sans modèle : les
 * chiffres du texte sont ceux de la fiche, au point près.
 *
 * Trois retraits décidés à la même revue ne reviennent pas : ni déroulé
 * horodaté, ni risques sur l'affaire, ni mémoire du compte.
 *
 * La règle anti-invention s'écrit dans le texte lui-même. Une rubrique sans
 * matière dans le transcript n'est pas omise en silence, et encore moins
 * remplie : elle dit qu'elle n'a pas été abordée, parce qu'un lecteur du CRM
 * doit pouvoir distinguer « rien à signaler » de « jamais demandé ».
 */

export type VisitReportHistoryEntry = {
  readonly meetingAt: Date;
  readonly meetingType: string | null;
  readonly sellerName: string | null;
  /**
   * Score de la grille du rendez-vous, `null` s'il n'a pas été noté. Absent
   * quand il n'est pas à montrer : la grille d'un rendez-vous ne se lit que
   * par son commercial et par les managers, et le rendez-vous d'un collègue
   * n'affiche donc pas la sienne.
   */
  readonly gridScore?: number | null;
};

export type VisitReportInput = {
  readonly meeting: {
    readonly prospectName: string;
    readonly prospectCompany: string | null;
    readonly meetingAt: Date;
    readonly meetingType: string | null;
    readonly durationMin: number | null;
    readonly potentialAmount: number | null;
    /** L'étape du pipeline, pour la ligne « Étape : … » de l'en-tête. */
    readonly pipelineStage?: string | null;
    /** La fiabilité de l'analyse (« bonne », « correcte », …), pour l'en-tête. */
    readonly analysisReliability?: string | null;
  };
  /** Le nom de l'organisation du commercial, pour la ligne « Côté … ». */
  readonly organizationName: string | null;
  readonly sellerName: string | null;
  /**
   * Les rendez-vous précédents avec ce contact, du plus récent au plus
   * ancien ; `null` quand la base n'a pas pu les lire, pour ne pas écrire
   * « premier rendez-vous » sur un compte qui en a déjà eu.
   */
  readonly history: readonly VisitReportHistoryEntry[] | null;
  /** Le nombre de rendez-vous précédents quand `history` n'en garde qu'une partie. */
  readonly historyTotal?: number;
  readonly extraction: VisitReportExtraction;
  readonly soncas: SoncasAnalysisResult | null;
  readonly disc: DiscAnalysisResult | null;
  readonly scorecard: ScorecardAnalysisResult | null;
  /**
   * Le coaching du rendez-vous. Depuis octobre 2026, KISS est seul à
   * l'écrire ; la grille ne donne plus que la note et les points perdus.
   */
  readonly kiss?: KissAnalysisResult | null;
  /**
   * L'analyse des objections, seule source des objections depuis octobre
   * 2026 : le compte rendu en relevait une seconde liste, différente.
   */
  readonly objectionsAnalysis?: ObjectionsAnalysisResult | null;
};

export const VISIT_REPORT_TITLE = "COMPTE RENDU DE VISITE";

/**
 * Les jalons de qualification lus dans la grille de découverte.
 *
 * Sept critères de la grille disent si l'affaire est qualifiée : un besoin
 * formulé, un impact chiffré, un périmètre, un décideur, un budget, un
 * calendrier, une suite datée. Un jalon est acquis à partir du niveau 3 sur 4,
 * partiel au niveau 2, à obtenir en dessous. Une grille qui ne porte pas ces
 * clés n'affiche pas la rubrique plutôt que d'en afficher une fausse.
 */
export const VISIT_REPORT_MILESTONES: readonly {
  readonly key: string;
  readonly label: string;
}[] = [
  { key: "B2", label: "Besoin identifié et formulé" },
  { key: "B3", label: "Impact chiffré" },
  { key: "B5", label: "Périmètre et volumétrie" },
  { key: "C1", label: "Décideur économique identifié" },
  { key: "C3", label: "Budget connu" },
  { key: "C4", label: "Calendrier de décision" },
  { key: "D1", label: "Prochaine étape datée" },
];

const MILESTONE_ACQUIRED_LEVEL = 3;
const MILESTONE_PARTIAL_LEVEL = 2;

const SONCAS_NAMES: Record<keyof SoncasAnalysisResult["drivers"], string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

const DISC_NAMES: Record<DiscAnalysisResult["dominant"], string> = {
  D: "Dominance",
  I: "Influence",
  S: "Stabilité",
  C: "Conformité",
};

export const VISIT_REPORT_METHOD_NOTE =
  "Ce compte rendu ne reprend que ce qui a été dit pendant le rendez-vous. Quand une rubrique n'a pas d'information dans le transcript, elle est signalée comme non abordée, jamais complétée pour faire bonne figure.";

const NOT_COVERED = "Non abordé pendant le rendez-vous.";

/*
  En heure de Paris, comme toute l'application : l'heure saisie dans le
  formulaire est lue dans ce fuseau, et un rendez-vous tard le soir garde son
  jour.
*/
const longDate = new Intl.DateTimeFormat("fr-FR", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Espaces insécables ramenées à des espaces simples : le texte part dans un CRM. */
function plainSpaces(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, " ");
}

function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function formatDate(date: Date): string {
  return plainSpaces(longDate.format(date));
}

function formatEuro(amount: number): string {
  return plainSpaces(euro.format(amount));
}

function sectionTitle(title: string): string {
  return title.toLocaleUpperCase("fr-FR");
}

/** Les mots qui ne sont pas un prénom : un titre, un article, ou « le prospect ». */
const NOT_A_FIRST_NAME = new Set([
  "m.",
  "mme",
  "mlle",
  "monsieur",
  "madame",
  "mademoiselle",
  "dr",
  "le",
  "la",
  "les",
  "un",
  "une",
  "notre",
  "votre",
]);

/**
 * Un nom tel que la maquette le signe après une citation : « H. Vasseur » pour
 * Hélène Vasseur. Un prénom seul, un titre (« Mme Vasseur ») ou une désignation
 * (« le prospect ») restent tels quels.
 */
export function shortPersonName(name: string): string {
  const words = clean(name).split(" ").filter(Boolean);
  if (words.length < 2) return words.join(" ");
  const first = words[0];
  if (NOT_A_FIRST_NAME.has(first.toLocaleLowerCase("fr-FR")))
    return words.join(" ");
  if (!/^\p{Lu}/u.test(first)) return words.join(" ");
  const initial = first.includes("-")
    ? first
        .split("-")
        .map((part) => `${part.charAt(0)}.`)
        .join("-")
    : `${first.charAt(0)}.`;
  return `${initial} ${words.slice(1).join(" ")}`;
}

/** Une citation comme la maquette l'écrit : les mots, puis qui les a dits et quand. */
function quoteLine(quote: VisitReportQuote): string | null {
  const text = clean(quote.texte).replace(/^«\s*|\s*»$/g, "");
  if (!text) return null;
  const who = shortPersonName(quote.qui);
  const moment = clean(quote.moment ?? "");
  const signature = [who, moment].filter(Boolean).join(", ");
  return signature ? `  « ${text} »  ${signature}` : `  « ${text} »`;
}

/** Vrai quand un compte rendu enregistré a la forme d'aujourd'hui, et non celle d'avant le lot 80a. */
export function isCurrentVisitReport(text: string | null | undefined): boolean {
  return (text ?? "").trimStart().startsWith(VISIT_REPORT_TITLE);
}

function participantLine(p: VisitReportParticipant): string | null {
  const nom = clean(p.nom);
  if (!nom) return null;
  const role = clean(p.role);
  const statut = clean(p.statut);
  return `- ${nom}${role ? `, ${role}` : ""}${statut ? ` (${statut})` : ""}`;
}

function nonEmpty<T>(items: readonly (T | null)[]): T[] {
  return items.filter((x): x is T => x !== null);
}

/** Un nom tel qu'on le compare : en minuscules, sans précision entre parenthèses ni après une virgule. */
function personKey(name: string): string {
  return clean(name.replace(/\([^)]*\)/g, " ").split(",")[0]).toLocaleLowerCase(
    "fr-FR",
  );
}

/**
 * Retire les citations du commercial : le compte rendu garde les mots du prospect.
 *
 * Une citation est au commercial quand son auteur porte le nom complet d'une
 * personne de son côté (le commercial de la fiche, ou « nous » dans
 * l'extraction), ou seulement le prénom de l'une d'elles, si personne du côté
 * client ne porte ce prénom. Comparer des débuts de chaîne écartait les mots de
 * Jeanne quand le commercial s'appelle Jean.
 */
function prospectQuotes(
  quotes: readonly VisitReportQuote[],
  input: VisitReportInput,
): VisitReportQuote[] {
  const participants = input.extraction.participants;
  const sellerSide = [
    input.sellerName ?? "",
    ...participants.nous.map((p) => p.nom),
  ]
    .map(personKey)
    .filter(Boolean);
  if (sellerSide.length === 0) return [...quotes];
  const clientFirstNames = new Set(
    [...participants.client, ...participants.cites]
      .map((p) => personKey(p.nom).split(" ")[0])
      .filter(Boolean),
  );
  const sellerFullNames = new Set(sellerSide);
  const sellerFirstNames = new Set(
    sellerSide
      .map((name) => name.split(" ")[0])
      .filter((first) => first && !clientFirstNames.has(first)),
  );
  return quotes.filter((q) => {
    const who = personKey(q.qui);
    if (!who) return true;
    if (sellerFullNames.has(who)) return false;
    return !(!who.includes(" ") && sellerFirstNames.has(who));
  });
}

class Lines {
  private readonly lines: string[] = [];

  push(line: string): void {
    this.lines.push(line);
  }

  blank(): void {
    if (this.lines.length > 0 && this.lines[this.lines.length - 1] !== "") {
      this.lines.push("");
    }
  }

  title(title: string): void {
    this.blank();
    this.lines.push(sectionTitle(title));
  }

  quotes(quotes: readonly VisitReportQuote[]): void {
    const rendered = nonEmpty(quotes.map(quoteLine));
    if (rendered.length === 0) return;
    this.blank();
    for (const line of rendered) this.lines.push(line);
  }

  toString(): string {
    while (this.lines.length > 0 && this.lines[this.lines.length - 1] === "") {
      this.lines.pop();
    }
    return this.lines.join("\n");
  }
}

function header(out: Lines, input: VisitReportInput): void {
  const m = input.meeting;
  out.push(VISIT_REPORT_TITLE);
  const parts = [
    clean(m.prospectCompany) || clean(m.prospectName),
    formatDate(m.meetingAt),
    clean(m.meetingType),
    m.durationMin ? `${m.durationMin} min` : "",
  ].filter(Boolean);
  out.push(parts.join(" · "));
  /*
    La troisième ligne de la maquette : l'étape, le potentiel et la fiabilité,
    séparés par des points médians, chacun seulement s'il est connu.
  */
  const details = [
    clean(m.pipelineStage ?? "")
      ? `Étape : ${clean(m.pipelineStage ?? "")}`
      : "",
    m.potentialAmount != null && m.potentialAmount > 0
      ? `Potentiel estimé : ${formatEuro(m.potentialAmount)}`
      : "",
    clean(m.analysisReliability ?? "")
      ? `Fiabilité de l'analyse : ${clean(m.analysisReliability ?? "")}`
      : "",
  ].filter(Boolean);
  if (details.length > 0) out.push(details.join(" · "));
}

function participants(out: Lines, input: VisitReportInput): void {
  const p = input.extraction.participants;
  const clientSide = clean(input.meeting.prospectCompany) || "prospect";
  const ourSide = clean(input.organizationName) || "notre organisation";
  const client = nonEmpty(p.client.map(participantLine));
  const nous = nonEmpty(p.nous.map(participantLine));
  const cites = nonEmpty(p.cites.map(participantLine));

  out.title("Participants");
  if (client.length === 0 && nous.length === 0) {
    out.push(`Côté ${clientSide} : ${clean(input.meeting.prospectName)}`);
    if (input.sellerName)
      out.push(`Côté ${ourSide} : ${clean(input.sellerName)}`);
    return;
  }
  if (client.length > 0) {
    out.push(`Côté ${clientSide} :`);
    for (const line of client) out.push(line);
  }
  if (nous.length > 0) {
    out.push(`Côté ${ourSide} :`);
    for (const line of nous) out.push(line);
  }
  if (cites.length > 0) {
    out.push("Personnes citées mais absentes :");
    for (const line of cites) out.push(line);
  }
}

function history(out: Lines, input: VisitReportInput): void {
  const origine = clean(input.extraction.origine);
  out.title("Historique du compte");
  if (input.history === null) {
    out.push(
      "Historique non disponible : les rendez-vous précédents n'ont pas pu être lus.",
    );
    if (origine) out.push(`Origine du compte : ${origine}`);
    return;
  }
  if (input.history.length === 0) {
    out.push(
      `Premier rendez-vous avec ce contact.${origine ? ` Origine : ${origine}` : ""}`,
    );
    return;
  }
  const shown = input.history.length;
  const total = Math.max(input.historyTotal ?? shown, shown);
  out.push(
    total > shown
      ? `${total} rendez-vous antérieurs avec ce contact, dont ${shown > 1 ? `les ${shown} plus récents` : "le plus récent"} :`
      : `${shown} rendez-vous antérieur${shown > 1 ? "s" : ""} avec ce contact :`,
  );
  for (const h of input.history) {
    const parts = [
      formatDate(h.meetingAt),
      clean(h.meetingType),
      clean(h.sellerName),
      h.gridScore === undefined
        ? ""
        : h.gridScore === null
          ? "non noté sur une grille"
          : `grille ${h.gridScore} sur 100`,
    ].filter(Boolean);
    out.push(`- ${parts.join(" · ")}`);
  }
  if (origine) out.push(`Origine du compte : ${origine}`);
}

function body(out: Lines, input: VisitReportInput): void {
  const x = input.extraction;
  out.title("En une phrase");
  out.push(clean(x.enUnePhrase) || NOT_COVERED);

  for (const theme of x.themes) {
    const titre = clean(theme.titre);
    const texte = clean(theme.texte);
    if (!titre || !texte) continue;
    out.title(titre);
    out.push(texte);
    out.quotes(prospectQuotes(theme.citations, input));
  }

  const optionalBlocks: [
    string,
    { texte: string; citations: VisitReportQuote[] },
  ][] = [
    ["Périmètre et volumétrie", x.perimetre],
    ["Concurrence et alternatives", x.concurrence],
  ];
  for (const [titre, bloc] of optionalBlocks) {
    const texte = clean(bloc.texte);
    if (!texte) continue;
    out.title(titre);
    out.push(texte);
    out.quotes(prospectQuotes(bloc.citations, input));
  }
}

/** Les objections de l'analyse dédiée, dans la forme du compte rendu. */
function objectionsFromAnalysis(
  analysis: ObjectionsAnalysisResult,
): VisitReportExtraction["objections"] {
  const effet: Record<string, string> = {
    handled: "levée",
    partial: "levée à moitié",
    open: "pas traitée",
  };
  return analysis.objections.map((o) => ({
    qui: o.who,
    moment: o.moment ?? "",
    objection: o.objection,
    reponse: o.response,
    effet: `${effet[o.outcome] ?? ""}${o.effect ? `. ${o.effect}` : ""}`,
    ...(o.verbatim === false ? { verbatim: false } : {}),
  }));
}

function objections(out: Lines, input: VisitReportInput): void {
  out.title("Objections et réponses apportées");
  const source = input.objectionsAnalysis
    ? objectionsFromAnalysis(input.objectionsAnalysis)
    : input.extraction.objections;
  const items = source.filter((o) => clean(o.objection));
  if (items.length === 0) {
    out.push("Aucune objection n'a été soulevée pendant le rendez-vous.");
    return;
  }
  for (const o of items) {
    const qui = shortPersonName(o.qui);
    const moment = clean(o.moment ?? "");
    out.push(
      `- Objection soulevée${qui ? ` par ${qui}` : ""}${moment ? ` à ${moment}` : ""} :`,
    );
    const words = clean(o.objection).replace(/^«\s*|\s*»$/g, "");
    /*
      Une objection que le transcript ne contient pas mot pour mot a été
      reformulée : elle reste, sans guillemets (`withQuotesFromTranscript`).
    */
    out.push(
      (o as { verbatim?: boolean }).verbatim === false
        ? `  En substance : ${words}`
        : `  « ${words} »`,
    );
    out.push(
      `  Réponse apportée : ${clean(o.reponse) || "aucune réponse pendant le rendez-vous."}`,
    );
    if (clean(o.effet)) out.push(`  Effet : ${clean(o.effet)}`);
  }
}

function profile(out: Lines, input: VisitReportInput): void {
  out.title("Profil de l'interlocuteur");
  const { soncas, disc } = input;
  if (!soncas && !disc) {
    out.push(
      "Profil non disponible : les analyses SONCAS et DISC n'ont pas abouti.",
    );
    return;
  }
  if (soncas) {
    const drivers = (
      Object.entries(soncas.drivers) as [
        keyof SoncasAnalysisResult["drivers"],
        { score: number; evidence: string[] },
      ][]
    ).sort((a, b) => b[1].score - a[1].score);
    out.push("Motivations d'achat, SONCAS, sur 100 :");
    for (const [key, driver] of drivers) {
      const proof = driver.evidence.some((e) => clean(e))
        ? ""
        : " (aucune preuve entendue)";
      out.push(
        `- ${SONCAS_NAMES[key]} ${Math.round(driver.score)} sur 100${proof}`,
      );
    }
    const principal = soncas.drivers[soncas.dominant];
    const principalQuotes = principal.evidence
      .map((e) => clean(e))
      .filter(Boolean);
    if (principalQuotes.length > 0) {
      out.blank();
      out.push(
        `Ce qui fonde le levier principal, ${SONCAS_NAMES[soncas.dominant].toLocaleLowerCase("fr-FR")} :`,
      );
      for (const q of principalQuotes) {
        out.push(`  « ${q.replace(/^«\s*|\s*»$/g, "")} »`);
      }
    }
  }
  if (disc) {
    out.blank();
    const style = disc.dominant;
    out.push(
      `Style de communication, DISC : style principal détecté ${style}, ${DISC_NAMES[style].toLocaleLowerCase("fr-FR")}, à ${Math.round(disc.scores[style])} sur 100. Le DISC décrit une manière de communiquer observée pendant ce rendez-vous, pas une personnalité.`,
    );
    for (const e of disc.evidence.map((x) => clean(x)).filter(Boolean)) {
      out.push(`  ${e}`);
    }
    const advice = disc.actionableAdvice;
    if (advice) {
      out.blank();
      out.push(`Comment lui parler : ${clean(advice.howToTalk)}`);
      out.push(`Ce qu'il vaut mieux éviter : ${clean(advice.whatToAvoid)}`);
    }
  }
}

function maturity(out: Lines, input: VisitReportInput): void {
  out.title("Maturité de l'affaire");
  const scorecard = input.scorecard;
  if (!scorecard) {
    out.push("Non évaluée : ce rendez-vous n'a pas été noté sur une grille.");
    return;
  }
  const grid = scorecardGridById(scorecard.gridId);
  const labels = new Map(
    (grid ? scorecardCriteria(grid) : []).map((c) => [c.key, c.label]),
  );
  const milestones = VISIT_REPORT_MILESTONES.filter((m) => labels.has(m.key));
  if (milestones.length === 0) {
    out.push(
      "Non évaluée : la grille de ce rendez-vous ne porte pas de jalons de qualification.",
    );
    return;
  }
  const levels = scorecardLevelsByKey(scorecard.criteria);
  let acquired = 0;
  let partial = 0;
  for (const m of milestones) {
    const level = levels.get(m.key) ?? 0;
    const state =
      level >= MILESTONE_ACQUIRED_LEVEL
        ? "acquis"
        : level >= MILESTONE_PARTIAL_LEVEL
          ? "partiel"
          : "à obtenir";
    if (level >= MILESTONE_ACQUIRED_LEVEL) acquired += 1;
    else if (level >= MILESTONE_PARTIAL_LEVEL) partial += 1;
    const label = labels.get(m.key) ?? "";
    out.push(
      `- ${m.label} : ${state} (critère ${m.key}, ${label.toLocaleLowerCase("fr-FR")}, niveau ${level} sur 4)`,
    );
  }
  out.push(
    `Qualification : ${acquired} jalon${acquired > 1 ? "s" : ""} acquis sur ${milestones.length}${
      partial > 0
        ? `, ${partial} partiellement couvert${partial > 1 ? "s" : ""}`
        : ""
    }.`,
  );
}

function commitments(out: Lines, input: VisitReportInput): void {
  const e = input.extraction.engagements;
  out.title("Engagements pris pendant le rendez-vous");
  const texte = clean(e.texte);
  if (texte) {
    out.push(texte);
    out.blank();
  }
  const items = e.liste.map((x) => clean(x)).filter(Boolean);
  if (items.length === 0) {
    out.push("- Aucun engagement formalisé pendant le rendez-vous");
  } else {
    for (const item of items) out.push(`- ${item}`);
  }
  out.quotes(e.citations);
}

function nextMeeting(out: Lines, input: VisitReportInput): void {
  const r = input.extraction.prochainRendezVous;
  out.title("Prochain rendez-vous");
  if (!clean(r.quand)) {
    out.push("Aucun prochain rendez-vous n'a été fixé pendant l'échange.");
    return;
  }
  out.push(`Quand : ${clean(r.quand)}`);
  if (clean(r.objectif)) out.push(`Objectif : ${clean(r.objectif)}`);
  if (clean(r.participants))
    out.push(`Participants attendus : ${clean(r.participants)}`);
  if (clean(r.aPreparer)) out.push(`À préparer : ${clean(r.aPreparer)}`);
}

function nextSteps(out: Lines, input: VisitReportInput): void {
  out.title("Prochaines étapes");
  const steps = input.extraction.prochainesEtapes.filter((s) =>
    clean(s.action),
  );
  if (steps.length === 0) {
    out.push("- Aucune étape n'a été convenue pendant le rendez-vous");
    return;
  }
  for (const s of steps) {
    const parts = [clean(s.action), clean(s.echeance), clean(s.porteur)].filter(
      Boolean,
    );
    out.push(`- ${parts.join(" · ")}`);
  }
}

function notCovered(out: Lines, input: VisitReportInput): void {
  out.title("Ce qui n'a pas été couvert, et la question à poser");
  if (!input.scorecard) {
    out.push("Non évalué : ce rendez-vous n'a pas été noté sur une grille.");
    return;
  }
  const view = scorecardResultView(input.scorecard);
  const points = view.pointsLost.filter((p) => clean(p.whatToSayInstead));
  if (points.length === 0) {
    out.push(
      "La grille ne relève aucun manque prioritaire sur ce rendez-vous.",
    );
    return;
  }
  for (const p of points) {
    out.push(`- ${p.label}`);
    if (clean(p.evidence)) out.push(`  Constat : ${clean(p.evidence)}`);
    out.push(
      `  À demander : « ${clean(p.whatToSayInstead).replace(/^«\s*|\s*»$/g, "")} »`,
    );
  }
}

function quality(out: Lines, input: VisitReportInput): void {
  out.title("Qualité du rendez-vous");
  const scorecard = input.scorecard;
  if (!scorecard) {
    out.push("Non évaluée : ce rendez-vous n'a pas été noté sur une grille.");
    return;
  }
  const view = scorecardResultView(scorecard);
  const grid = scorecardGridById(scorecard.gridId);
  const criteriaCount = grid
    ? scorecardCriteria(grid).length
    : scorecard.criteria.length;
  out.push(
    `Grille « ${clean(view.gridName)} » : ${view.overallScore} sur 100, sur ${criteriaCount} critères.`,
  );
  for (const b of view.blocks) {
    out.push(`- ${b.key}. ${clean(b.name)} : ${b.score} sur ${b.max}`);
  }
  const weakest = [...view.blocks]
    .filter((b) => b.max > 0)
    .sort((a, b) => a.score / a.max - b.score / b.max)[0];
  if (weakest) {
    out.push(
      `Point de vigilance : le bloc ${clean(weakest.name).toLocaleLowerCase("fr-FR")}, à ${weakest.percent} % de son poids.`,
    );
  }

  /*
    Le coaching vient de KISS ; la grille ne l'écrit plus. Une analyse
    d'avant octobre 2026 sans KISS garde le coaching que sa grille portait.
  */
  const kiss = input.kiss ?? null;
  const lists: [string, string[]][] = [
    ["Ce qui a fonctionné :", kiss?.keep ?? scorecard.keep ?? []],
    ["À élever d'un niveau :", kiss?.improve ?? scorecard.improve ?? []],
    ["À arrêter :", kiss?.stop ?? scorecard.stop ?? []],
    ["À essayer au prochain rendez-vous :", kiss?.start ?? []],
  ];
  let first = true;
  for (const [label, items] of lists) {
    const rendered = items.map((x) => clean(x)).filter(Boolean);
    if (rendered.length === 0) continue;
    if (first) {
      out.blank();
      first = false;
    }
    out.push(label);
    for (const item of rendered) out.push(`- ${item}`);
  }

  const question = clean(
    kiss?.goldenQuestion ?? view.goldenQuestion ?? "",
  ).replace(/^«\s*|\s*»$/g, "");
  const challenge = clean(kiss?.challenge ?? view.challenge ?? "");
  if (question || challenge) out.blank();
  if (question) {
    out.push("Question à poser au prochain échange :");
    out.push(`  « ${question} »`);
  }
  if (challenge) out.push(`Défi du commercial : ${challenge}`);
}

function methodNote(out: Lines): void {
  out.title("Note de méthode");
  out.push(VISIT_REPORT_METHOD_NOTE);
}

/** Le compte rendu complet, prêt à coller dans un CRM. */
export function composeVisitReport(input: VisitReportInput): string {
  const out = new Lines();
  header(out, input);
  participants(out, input);
  history(out, input);
  body(out, input);
  objections(out, input);
  profile(out, input);
  maturity(out, input);
  commitments(out, input);
  nextMeeting(out, input);
  nextSteps(out, input);
  notCovered(out, input);
  quality(out, input);
  methodNote(out);
  return out.toString();
}

/**
 * Vrai pour une ligne de titre du compte rendu, que la fiche met en valeur.
 *
 * Les titres sont écrits en capitales, après une ligne vide : c'est la seule
 * marque qui survit au copier-coller dans un CRM, où le gras disparaît. La
 * ligne précédente, quand on la donne, écarte une ligne de texte écrite en
 * capitales juste sous un titre.
 */
export function isVisitReportHeading(
  line: string,
  previousLine?: string,
): boolean {
  // Une ligne en retrait est une citation ou un détail, jamais un titre.
  if (line !== line.trimStart()) return false;
  if (previousLine !== undefined && previousLine.trim() !== "") return false;
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.startsWith("-")) return false;
  if (/\p{Ll}/u.test(trimmed)) return false;
  return (trimmed.match(/\p{Lu}/gu) ?? []).length >= 2;
}

/** Les rubriques tirées de la grille, qui ne se lisent que par le commercial et les managers. */
const SELLER_COACHING_TITLES = new Set(
  [
    "Maturité de l'affaire",
    "Ce qui n'a pas été couvert, et la question à poser",
    "Qualité du rendez-vous",
  ].map(sectionTitle),
);

/**
 * Le compte rendu tel que le lit un membre sans accès au coaching du
 * commercial.
 *
 * La grille et le coaching d'un rendez-vous ne se lisent que par le commercial
 * assigné et par les managers ; le reste du compte rendu (qui était là, ce qui
 * a été dit, la suite) sert à toute l'équipe. On retire les rubriques tirées de
 * la grille et les scores de grille de l'historique. Le texte copié est le
 * texte affiché : il ne contient donc rien de ce qui est retiré.
 */
export function visitReportWithoutSellerCoaching(report: string): string {
  const lines = report.split("\n");
  const kept: string[] = [];
  let skipping = false;
  lines.forEach((line, index) => {
    if (isVisitReportHeading(line, index > 0 ? lines[index - 1] : undefined)) {
      skipping = SELLER_COACHING_TITLES.has(line.trim());
    }
    if (skipping) return;
    const withoutScore = line.replace(
      / · (grille \d+ sur 100|non noté sur une grille)$/,
      "",
    );
    if (withoutScore.trim() === "" && kept[kept.length - 1]?.trim() === "") {
      return;
    }
    kept.push(withoutScore);
  });
  return kept.join("\n").trim();
}

/**
 * Ne garde un moment (« 14'30 ») que si le transcript le porte tel quel.
 *
 * Un transcript sans horodatage ne donne aucun moment : un modèle qui en
 * écrit un l'a estimé, et un compte rendu ne cite pas un moment inventé.
 */
export function withMomentsFromTranscript(
  extraction: VisitReportExtraction,
  transcript: string,
): VisitReportExtraction {
  const keep = (moment: string | undefined): string => {
    const m = clean(moment ?? "");
    return m && transcript.includes(m) ? m : "";
  };
  const quotes = (list: readonly VisitReportQuote[]) =>
    list.map((q) => ({ ...q, moment: keep(q.moment) }));
  return {
    ...extraction,
    themes: extraction.themes.map((t) => ({
      ...t,
      citations: quotes(t.citations),
    })),
    perimetre: {
      ...extraction.perimetre,
      citations: quotes(extraction.perimetre.citations),
    },
    concurrence: {
      ...extraction.concurrence,
      citations: quotes(extraction.concurrence.citations),
    },
    objections: extraction.objections.map((o) => ({
      ...o,
      moment: keep(o.moment),
    })),
    engagements: {
      ...extraction.engagements,
      citations: quotes(extraction.engagements.citations),
    },
  };
}

/**
 * Ne garde comme citation que des mots réellement prononcés.
 *
 * Le compte rendu met des guillemets : ce qui est entre guillemets doit se
 * retrouver dans le transcript, à quelques fautes près, comme pour la grille
 * (`transcript-evidence.ts`). Une citation reformulée par le modèle disparaît ;
 * une objection reformulée reste, mais s'écrit « En substance : » et sans
 * guillemets, pour que le lecteur ne la prenne pas pour les mots du prospect.
 */
export function withQuotesFromTranscript(
  extraction: VisitReportExtraction,
  transcript: string,
): VisitReportExtraction {
  const words = evidenceWords(transcript);
  const found = (text: string) => isExcerptInSource(clean(text), words);
  const quotes = (list: readonly VisitReportQuote[]) =>
    list.filter((q) => found(q.texte));
  return {
    ...extraction,
    themes: extraction.themes.map((t) => ({
      ...t,
      citations: quotes(t.citations),
    })),
    perimetre: {
      ...extraction.perimetre,
      citations: quotes(extraction.perimetre.citations),
    },
    concurrence: {
      ...extraction.concurrence,
      citations: quotes(extraction.concurrence.citations),
    },
    objections: extraction.objections.map((o) => ({
      ...o,
      verbatim: found(o.objection),
    })),
    engagements: {
      ...extraction.engagements,
      citations: quotes(extraction.engagements.citations),
    },
  };
}

const MONTHS =
  "janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre";
const DAY_AND_MONTH = new RegExp(
  String.raw`(?<![\p{L}\d])(\d{1,2})(?:er)?\s+(${MONTHS})(?![\p{L}])`,
  "giu",
);

const WEEKDAY =
  /(?<![\p{L}])(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?![\p{L}])/gu;

/** « À fixer » : ce que le compte rendu écrit quand aucune date n'a été convenue. */
export const VISIT_REPORT_DATE_TO_FIX =
  "À fixer : aucune date ferme n'a été convenue pendant le rendez-vous.";

/**
 * Une date du compte rendu (« le 2 novembre ») doit figurer telle quelle dans
 * le transcript. Le modèle a écrit « lundi 2 novembre à 14h00 » pour un
 * prospect qui avait dit du 2 « c'est mon anniversaire, je ne serai pas
 * disponible » : une date qui n'est pas dans le transcript ne s'écrit pas
 * comme convenue.
 */
export function withDatesFromTranscript(
  extraction: VisitReportExtraction,
  transcript: string,
): VisitReportExtraction {
  const said = normalizedForDates(transcript);
  const allSaid = (text: string) => {
    const t = normalizedForDates(text);
    const dates = [...t.matchAll(DAY_AND_MONTH)];
    if (dates.length === 0) return true;
    const daysOk = dates.every((m) =>
      said.includes(`${Number(m[1])} ${normalizedForDates(m[2])}`),
    );
    /* Avec une date, le jour de la semaine nommé doit avoir été dit : « mardi 4 novembre » pour un mercredi ne passe pas. Une échéance sans date (« d'ici vendredi ») reste telle quelle. */
    const weekdaysOk = [...t.matchAll(WEEKDAY)].every((m) =>
      new RegExp(String.raw`(?<![\p{L}])${m[1]}(?![\p{L}])`, "u").test(said),
    );
    return daysOk && weekdaysOk;
  };
  const next = extraction.prochainRendezVous;
  return {
    ...extraction,
    prochainRendezVous:
      clean(next.quand) && !allSaid(next.quand)
        ? { ...next, quand: VISIT_REPORT_DATE_TO_FIX }
        : next,
    prochainesEtapes: extraction.prochainesEtapes.map((s) =>
      clean(s.echeance) && !allSaid(s.echeance)
        ? { ...s, echeance: "à fixer" }
        : s,
    ),
  };
}

/** Les quantièmes écrits en lettres, pour les comparer à ceux écrits en chiffres. */
const DAY_WORDS: Record<string, number> = {
  premier: 1,
  un: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  "dix-sept": 17,
  "dix-huit": 18,
  "dix-neuf": 19,
  vingt: 20,
  "vingt et un": 21,
  "vingt-et-un": 21,
  "vingt-deux": 22,
  "vingt-trois": 23,
  "vingt-quatre": 24,
  "vingt-cinq": 25,
  "vingt-six": 26,
  "vingt-sept": 27,
  "vingt-huit": 28,
  "vingt-neuf": 29,
  trente: 30,
  "trente et un": 31,
  "trente-et-un": 31,
};

/** « quatre novembre » devient « 4 novembre », et seulement devant un mois. */
const DAY_WORDS_BEFORE_MONTH = new RegExp(
  String.raw`(?<![\p{L}-])(${Object.keys(DAY_WORDS)
    .sort((a, b) => b.length - a.length)
    .join("|")})\s+(?=(?:${MONTHS})(?![\p{L}]))`,
  "giu",
);

function normalizedForDates(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/\s+/g, " ")
    .replace(
      DAY_WORDS_BEFORE_MONTH,
      (_, word: string) => `${DAY_WORDS[word] ?? word} `,
    )
    .replace(/(\d{1,2})er\b/g, "$1");
}
