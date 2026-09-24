import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "./analysis-result-zod";
import { APP_TIME_ZONE } from "./app-time-zone";
import { scorecardGridById, scorecardCriteria } from "./scorecard-grid";
import type { ScorecardAnalysisResult } from "./scorecard-result-zod";
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

function quoteLine(quote: VisitReportQuote): string | null {
  const text = clean(quote.texte).replace(/^«\s*|\s*»$/g, "");
  if (!text) return null;
  const who = clean(quote.qui);
  return who ? `  « ${text} » (${who})` : `  « ${text} »`;
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
  if (m.potentialAmount != null && m.potentialAmount > 0) {
    out.push(`Potentiel estimé : ${formatEuro(m.potentialAmount)}`);
  }
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

function objections(out: Lines, input: VisitReportInput): void {
  out.title("Objections et réponses apportées");
  const items = input.extraction.objections.filter((o) => clean(o.objection));
  if (items.length === 0) {
    out.push("Aucune objection n'a été soulevée pendant le rendez-vous.");
    return;
  }
  for (const o of items) {
    const qui = clean(o.qui);
    out.push(`- Objection soulevée${qui ? ` par ${qui}` : ""} :`);
    out.push(`  « ${clean(o.objection).replace(/^«\s*|\s*»$/g, "")} »`);
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

  const lists: [string, string[]][] = [
    ["Ce qui a fonctionné :", scorecard.keep],
    ["À élever d'un niveau :", scorecard.improve],
    ["À arrêter :", scorecard.stop],
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

  const question = clean(view.goldenQuestion).replace(/^«\s*|\s*»$/g, "");
  const challenge = clean(view.challenge);
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
