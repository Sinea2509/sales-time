import { z } from "zod";

/**
 * Les trois blocs à coller dans Pipedrive après un rendez-vous, selon la
 * méthode SEED de Sinéa : le Bloc SEED (champ « SEED » de l'affaire), la
 * Carte d'identité (description de l'organisation) et le Projet de formation
 * (champ « Projet de Formation » de l'affaire).
 *
 * Demande de Thomas du 23 octobre 2026 : aider les commerciaux à mieux remplir
 * le CRM. Le modèle lit le transcript et rend des faits ; le produit compose
 * les blocs, calcule le potentiel et écrit « Non abordé » à la place de ce qui
 * manque. Rien ne s'invente : un fait absent reste absent.
 */

/** Le tarif Sinéa : 1 890 € HT par jour et par groupe. */
export const SINEA_DAY_RATE_EUR = 1890;

/** L'hypothèse de la direction quand la durée n'est pas dite : 3 jours par groupe. */
export const DEFAULT_DAYS_PER_GROUP = 3;

export const NOT_DISCUSSED = "Non abordé";

export const PROJECT_MATURITIES = [
  "idee_floue",
  "besoin_identifie",
  "projet_valide",
  "budget_vote",
] as const;
export type ProjectMaturity = (typeof PROJECT_MATURITIES)[number];

const MATURITY_LABEL: Record<ProjectMaturity, string> = {
  idee_floue: "Idée floue",
  besoin_identifie: "Besoin identifié",
  projet_valide: "Projet validé",
  budget_vote: "Budget voté",
};

export const TENSIONS = ["haute", "moyenne", "basse"] as const;
type Tension = (typeof TENSIONS)[number];

const TENSION_LABEL: Record<Tension, string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

export const CONTACT_INFLUENCES = [
  "decideur",
  "prescripteur",
  "influenceur",
] as const;
type ContactInfluence = (typeof CONTACT_INFLUENCES)[number];

const INFLUENCE_LABEL: Record<ContactInfluence, string> = {
  decideur: "Décideur",
  prescripteur: "Prescripteur",
  influenceur: "Influenceur",
};

/** Un fait court, ou `null` quand le rendez-vous ne l'a pas abordé. */
const fact = z.string().max(300).nullable();
const factList = z.array(z.string().max(200)).max(6);

const pipedriveProjectSchema = z.object({
  name: z.string().max(80),
  target: fact,
  format: fact,
  maturity: z.enum(PROJECT_MATURITIES),
  groups: z.number().int().min(1).max(50).nullable(),
  daysPerGroup: z.number().min(0.5).max(30).nullable(),
  tension: z.enum(TENSIONS).nullable(),
  competitor: fact,
});
export type PipedriveProject = z.infer<typeof pipedriveProjectSchema>;

/** Ce que le modèle lit dans le transcript. Les blocs se composent ensuite ici. */
export const pipedriveExtractionSchema = z.object({
  company: fact,
  themes: z.array(z.string().max(80)).max(6),
  tension: z.enum(TENSIONS).nullable(),
  decision: fact,
  nextMeeting: fact,
  status: z.string().max(400),
  projects: z.array(pipedriveProjectSchema).max(6),
  sineaCommitments: factList,
  clientCommitments: factList,
  nextMeetingGoal: fact,
  nextMeetingAngle: fact,
  followUp: fact,
  watchPoints: z
    .array(z.object({ risk: z.string().max(200), quote: z.string().max(240) }))
    .max(4),
  identity: z.object({
    headcount: fact,
    sector: fact,
    opco: fact,
    contactFirstName: fact,
    contactRole: fact,
    contactInfluence: z.enum(CONTACT_INFLUENCES).nullable(),
    decisionCircuit: fact,
    trainingBudget: fact,
    tools: fact,
    trainingHistory: fact,
    competition: fact,
  }),
  trainingProject: z.object({
    theme: fact,
    audience: fact,
    participantProfile: fact,
    currentLevel: fact,
    context: fact,
    when: fact,
    successCriteria: fact,
    skills: fact,
    deliverables: fact,
    budget: fact,
    urgency: fact,
    whyUs: fact,
    decisionCriteria: fact,
    nextMilestone: fact,
    competitors: fact,
    trainingHistory: fact,
    closingScore: z.number().int().min(0).max(10).nullable(),
    closingJustification: fact,
    format: fact,
    place: fact,
    logistics: fact,
    language: fact,
    opco: fact,
    missingInfo: factList,
    nextQuestions: z.array(z.string().max(200)).max(5),
  }),
});
export type PipedriveExtraction = z.infer<typeof pipedriveExtractionSchema>;

export type PipedriveBlocks = {
  seed: string;
  identity: string;
  trainingProject: string;
  /** Le projet de formation n'a pas assez d'éléments : le bloc dit ce qui manque. */
  trainingProjectIncomplete: boolean;
  potentialTotal: number | null;
};

export type PipedriveContext = {
  /** Le nom de l'entreprise saisi sur la fiche, à défaut du transcript. */
  company: string | null;
  prospectName: string;
  meetingAt: Date;
  /** Le rang du rendez-vous avec ce contact : 1 pour le premier (R1). */
  meetingRank: number;
  salesScore: number | null;
  medalName: string | null;
  /** Le premier défi laissé pour le prochain rendez-vous. */
  challenge: string | null;
};

const RULE = "═".repeat(43);

const euros = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function formatEuros(amount: number): string {
  // Une espace simple plutôt que l'espace fine insécable : Pipedrive la rend mal.
  return `${euros.format(amount).replace(/\s/g, " ")}€`;
}

const dateFr = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Paris",
});

function or(value: string | null | undefined): string {
  const v = value?.trim();
  return v ? v : NOT_DISCUSSED;
}

function listOr(values: readonly string[], fallback = NOT_DISCUSSED): string {
  const kept = values.map((v) => v.trim()).filter(Boolean);
  return kept.length ? kept.join(" ; ") : fallback;
}

/**
 * Le potentiel d'un projet : groupes × jours × 1 890 €. Sans nombre de
 * groupes, il ne se chiffre pas ; sans durée, l'hypothèse de 3 jours vaut.
 */
export function projectPotential(project: {
  groups: number | null;
  daysPerGroup: number | null;
}): { amount: number; calculation: string } | null {
  if (project.groups == null) return null;
  const days = project.daysPerGroup ?? DEFAULT_DAYS_PER_GROUP;
  const amount = Math.round(project.groups * days * SINEA_DAY_RATE_EUR);
  const daysLabel = String(days).replace(".", ",");
  return {
    amount,
    calculation: `${project.groups} grp × ${daysLabel}j × ${formatEuros(SINEA_DAY_RATE_EUR)}`,
  };
}

function potentialLabel(project: PipedriveProject): string {
  const p = projectPotential(project);
  return p ? `${formatEuros(p.amount)} (${p.calculation})` : "Non chiffré";
}

/** Les projets chiffrables, hors idées floues sans aucune information. */
function splitProjects(projects: readonly PipedriveProject[]) {
  const isEmptyIdea = (p: PipedriveProject) =>
    p.maturity === "idee_floue" &&
    !p.target &&
    !p.format &&
    p.groups == null &&
    !p.competitor;
  return {
    active: projects.filter((p) => !isEmptyIdea(p)),
    watching: projects.filter(isEmptyIdea),
  };
}

export function totalPotential(
  projects: readonly PipedriveProject[],
): number | null {
  const amounts = projects
    .map((p) => projectPotential(p)?.amount)
    .filter((a): a is number => a != null);
  return amounts.length ? amounts.reduce((a, b) => a + b, 0) : null;
}

function composeSeed(x: PipedriveExtraction, ctx: PipedriveContext): string {
  const company = or(ctx.company ?? x.company);
  const date = dateFr.format(ctx.meetingAt);
  const rank = `R${ctx.meetingRank}`;
  const { active, watching } = splitProjects(x.projects);
  const total = totalPotential(active);
  const score =
    ctx.salesScore != null
      ? `${ctx.salesScore}/100${ctx.medalName ? ` (${ctx.medalName})` : ""}`
      : NOT_DISCUSSED;
  const mainPotential =
    active.length === 1
      ? potentialLabel(active[0])
      : total != null
        ? formatEuros(total)
        : "Non chiffré";

  const lines = [
    `⚡ RÉSUMÉ EXPRESS · ${company} · ${date} · ${rank}`,
    RULE,
    `THÉMATIQUE : ${listOr(x.themes)}`,
    `POTENTIEL : ${mainPotential} | TENSION : ${x.tension ? TENSION_LABEL[x.tension] : NOT_DISCUSSED}`,
    `DÉCISION : ${or(x.decision)}`,
    `PROCHAIN RDV : ${or(x.nextMeeting)}`,
    `STATUT : ${or(x.status)}`,
    `SCORE : ${score}`,
    "",
    "📡 PROJETS",
    RULE,
  ];
  if (active.length === 0) lines.push("Aucun projet qualifié.");
  active.forEach((p, i) => {
    lines.push(
      `PROJET ${i + 1} · ${p.name}`,
      `• Cible : ${or(p.target)} | Format : ${or(p.format)} | Maturité : ${MATURITY_LABEL[p.maturity]} | Potentiel : ${potentialLabel(p)} | Tension : ${p.tension ? TENSION_LABEL[p.tension] : NOT_DISCUSSED} | Concurrent : ${or(p.competitor)}`,
    );
  });
  if (watching.length) {
    lines.push(`SUJETS EN VEILLE : ${watching.map((p) => p.name).join(", ")}`);
  }
  lines.push(
    `POTENTIEL TOTAL : ${total != null ? formatEuros(total) : "Non chiffré"}`,
    "",
    "➡️ FEUILLE DE ROUTE",
    RULE,
    `ENGAGEMENTS SINÉA : ${listOr(x.sineaCommitments)}`,
    `ENGAGEMENTS CLIENT : ${listOr(x.clientCommitments, "Aucun")}`,
    `PROCHAIN RDV : ${or(x.nextMeeting)}`,
    `STRATÉGIE R${ctx.meetingRank + 1} : Objectif ${or(x.nextMeetingGoal)} | Angle ${or(x.nextMeetingAngle)}`,
    `RELANCE : ${or(x.followUp)}`,
    `⚠️ VIGILANCES : ${
      x.watchPoints.length
        ? x.watchPoints
            .map((w) => (w.quote ? `${w.risk} « ${w.quote} »` : w.risk))
            .join(" ; ")
        : "Aucune"
    }`,
    "",
    "🧠 MÉMOIRE SEED",
    RULE,
    `TYPE:${rank}|DATE:${date}|SCORE:${ctx.salesScore != null ? `${ctx.salesScore}/100` : "NA"}`,
    `ORGA:${[
      x.identity.headcount,
      x.identity.sector,
      x.identity.opco,
      x.identity.contactFirstName,
      x.identity.trainingBudget,
    ]
      .map((v) => v?.trim() || "NA")
      .join(",")}`,
    `PROJETS:${
      active.length
        ? active
            .map((p) => {
              const potential = projectPotential(p);
              return `${p.name}|${potential ? formatEuros(potential.amount) : "NA"}|${MATURITY_LABEL[p.maturity]}`;
            })
            .join(" / ")
        : "NA"
    }`,
    `ENGAGEMENTS_SINEA:${listOr(x.sineaCommitments, "NA")}`,
    `ENGAGEMENTS_CLIENT:${listOr(x.clientCommitments, "NA")}`,
    `VIGILANCES:${x.watchPoints.length ? x.watchPoints.map((w) => w.risk).join(" ; ") : "NA"}`,
    `DEFI:${ctx.challenge?.trim() || "NA"}`,
  );
  return lines.join("\n");
}

function composeIdentity(
  x: PipedriveExtraction,
  ctx: PipedriveContext,
): string {
  const id = x.identity;
  const contact = id.contactFirstName
    ? `${id.contactFirstName}${id.contactRole ? ` · ${id.contactRole}` : ""}${
        id.contactInfluence ? ` (${INFLUENCE_LABEL[id.contactInfluence]})` : ""
      }`
    : NOT_DISCUSSED;
  return [
    `🦋 CARTE D'IDENTITÉ · ${or(ctx.company ?? x.company)}`,
    RULE,
    `→ Effectif : ${or(id.headcount)} | Secteur : ${or(id.sector)} | OPCO : ${or(id.opco)}`,
    `→ Interlocuteur clé : ${contact}`,
    `→ Circuit de décision : ${or(id.decisionCircuit)} | Budget formation : ${or(id.trainingBudget)}`,
    `→ Outils : ${or(id.tools)} | Historique formation : ${or(id.trainingHistory)} | Concurrence : ${or(id.competition)}`,
  ].join("\n");
}

const MATURE: readonly ProjectMaturity[] = [
  "besoin_identifie",
  "projet_valide",
  "budget_vote",
];

/**
 * Le projet de formation ne se remplit qu'avec un projet au moins « Besoin
 * identifié », et au moins une cible, un contexte et une thématique. Sinon le
 * bloc dit précisément ce qui manque, et quoi demander au prochain rendez-vous.
 */
function composeTrainingProject(
  x: PipedriveExtraction,
  ctx: PipedriveContext,
): { text: string; incomplete: boolean } {
  const t = x.trainingProject;
  const missing: string[] = [];
  if (!x.projects.some((p) => MATURE.includes(p.maturity))) {
    missing.push("un besoin identifié (aucun projet n'a dépassé l'idée floue)");
  }
  if (!t.audience?.trim()) missing.push("la cible (qui, combien, groupes)");
  if (!t.context?.trim()) missing.push("le contexte");
  if (!t.theme?.trim()) missing.push("la thématique");

  if (missing.length) {
    const more = t.missingInfo.map((m) => m.trim()).filter(Boolean);
    return {
      incomplete: true,
      text: [
        "🟣 PROJET DE FORMATION · Pas assez d'éléments",
        `Il manque : ${[...new Set([...missing, ...more])].join(" ; ")}`,
        `Actions : ${listOr(t.nextQuestions, "Reprendre la découverte au prochain rendez-vous")}`,
      ].join("\n"),
    };
  }

  const closing =
    t.closingScore != null
      ? `${t.closingScore}/10${t.closingJustification ? ` · ${t.closingJustification}` : ""}`
      : NOT_DISCUSSED;
  return {
    incomplete: false,
    text: [
      `🟣 PROJET DE FORMATION · ${or(t.theme)} · ${or(ctx.company ?? x.company)}`,
      RULE,
      `📋 CADRAGE : Thématique : ${or(t.theme)} | Public : ${or(t.audience)} | Profil participants : ${or(t.participantProfile)} | Niveau actuel : ${or(t.currentLevel)} | Contexte : ${or(t.context)} | Quand : ${or(t.when)}`,
      `🎯 OBJECTIFS : Critères de succès client : ${or(t.successCriteria)} | Objectifs & compétences : ${or(t.skills)} | Livrables attendus : ${or(t.deliverables)}`,
      `💰 CLOSING : Budget : ${or(t.budget)} | Urgence : ${or(t.urgency)} | Pourquoi nous : ${or(t.whyUs)} | Critères de décision : ${or(t.decisionCriteria)} | Prochain jalon : ${or(t.nextMilestone)} | OF concurrents : ${or(t.competitors)} | Historique OF : ${or(t.trainingHistory)}`,
      `📊 POTENTIEL DE CLOSING : ${closing}`,
      `🔧 CONTRAINTES : Format : ${or(t.format)} | Lieu : ${or(t.place)} | Logistique : ${or(t.logistics)} | Langue : ${or(t.language)} | OPCO : ${or(t.opco)}`,
      `❓ INFOS MANQUANTES : ${listOr(t.missingInfo, "Aucune")}`,
    ].join("\n"),
  };
}

/**
 * Retire les citations introuvables dans le transcript : une vigilance garde
 * son risque, mais une citation inventée ne s'écrit pas dans le CRM.
 */
export function withVerifiedQuotes(
  x: PipedriveExtraction,
  isInTranscript: (excerpt: string) => boolean,
): PipedriveExtraction {
  return {
    ...x,
    watchPoints: x.watchPoints.map((w) => ({
      risk: w.risk,
      quote: w.quote.trim() && isInTranscript(w.quote) ? w.quote.trim() : "",
    })),
  };
}

export function composePipedriveBlocks(
  extraction: PipedriveExtraction,
  ctx: PipedriveContext,
): PipedriveBlocks {
  const project = composeTrainingProject(extraction, ctx);
  return {
    seed: composeSeed(extraction, ctx),
    identity: composeIdentity(extraction, ctx),
    trainingProject: project.text,
    trainingProjectIncomplete: project.incomplete,
    potentialTotal: totalPotential(splitProjects(extraction.projects).active),
  };
}
