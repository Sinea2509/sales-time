import { z } from "zod";

/**
 * La fiche de préparation d'un premier rendez-vous, nourrie par une recherche
 * web : ce qu'on sait de l'entreprise, du décideur, de ses douleurs, et le plan
 * d'attaque.
 *
 * Reprise de la méthode « Seed » de Sinéa (prompt transmis par Thomas le 28
 * octobre 2026). Le modèle ne rend que ce que la recherche a trouvé : un fait
 * absent vaut `null` ou une liste vide, et la fiche le dit au lieu de
 * l'inventer.
 */

const fact = z.string().max(400).nullable();

export const PROSPECT_DYNAMICS = [
  "croissance",
  "stable",
  "difficulte",
] as const;
export const DISC_STYLES = [
  "dominant",
  "influent",
  "stable",
  "conforme",
] as const;

export const prospectResearchSchema = z.object({
  company: z.object({
    headquarters: fact,
    headcount: fact,
    sector: fact,
    dynamic: z.enum(PROSPECT_DYNAMICS).nullable(),
    dynamicWhy: fact,
    tools: z.array(z.string().max(60)).max(3),
    realJob: fact,
  }),
  decisionMaker: z.object({
    discStyle: z.enum(DISC_STYLES).nullable(),
    discWhy: fact,
    iceBreaker: fact,
  }),
  pain: z.object({
    hiring: z.array(z.string().max(240)).max(4),
    cultureKeywords: z.array(z.string().max(40)).max(3),
  }),
  attackPlan: z.object({
    priorityOffer: fact,
    offerWhy: fact,
    goldenQuestions: z.array(z.string().max(320)).max(3),
  }),
  clientReferences: z
    .array(
      z.object({
        client: z.string().max(100),
        theme: z.string().max(160),
        link: z.string().max(240),
      }),
    )
    .max(3),
  unknowns: z.array(z.string().max(200)).max(6),
});
export type ProspectResearch = z.infer<typeof prospectResearchSchema>;

const DYNAMIC_LABEL: Record<(typeof PROSPECT_DYNAMICS)[number], string> = {
  croissance: "En croissance",
  stable: "Stable",
  difficulte: "En difficulté",
};

const DISC_LABEL: Record<(typeof DISC_STYLES)[number], string> = {
  dominant: "Dominant (rouge)",
  influent: "Influent (jaune)",
  stable: "Stable (vert)",
  conforme: "Conforme (bleu)",
};

export function prospectDynamicLabel(
  d: ProspectResearch["company"]["dynamic"],
): string | null {
  return d ? DYNAMIC_LABEL[d] : null;
}

export function discStyleLabel(
  d: ProspectResearch["decisionMaker"]["discStyle"],
): string | null {
  return d ? DISC_LABEL[d] : null;
}

/** Les sources d'une recherche : adresses web uniques, dans l'ordre, huit au plus. */
export function cleanSources(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    let url: URL;
    try {
      url = new URL(raw.trim());
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const key = url.href.replace(/\/$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url.href);
    if (out.length === 8) break;
  }
  return out;
}

const NOT_FOUND = "Non trouvé";

/** La fiche en texte simple, pour la coller dans le CRM ou un message. */
export function prospectResearchAsText(
  r: ProspectResearch,
  input: { companyName: string; personName: string | null; sources: string[] },
): string {
  const v = (s: string | null | undefined) =>
    s?.trim() ? s.trim() : NOT_FOUND;
  const lines = [
    `PRÉPARATION · ${input.companyName}${input.personName ? ` · ${input.personName}` : ""}`,
    "",
    "1. SANTÉ ET CONTEXTE",
    `- Siège : ${v(r.company.headquarters)}`,
    `- Effectif : ${v(r.company.headcount)}`,
    `- Secteur : ${v(r.company.sector)}`,
    `- Dynamique : ${prospectDynamicLabel(r.company.dynamic) ?? NOT_FOUND}${r.company.dynamicWhy ? ` (${r.company.dynamicWhy})` : ""}`,
    `- Outils : ${r.company.tools.length ? r.company.tools.join(", ") : NOT_FOUND}`,
    `- Le vrai métier : ${v(r.company.realJob)}`,
    "",
    "2. LE DÉCIDEUR",
    `- DISC estimé : ${discStyleLabel(r.decisionMaker.discStyle) ?? NOT_FOUND}${r.decisionMaker.discWhy ? ` (${r.decisionMaker.discWhy})` : ""}`,
    `- Ice breaker : ${v(r.decisionMaker.iceBreaker)}`,
    "",
    "3. LA DOULEUR",
    `- Ce qu'ils recrutent : ${r.pain.hiring.length ? r.pain.hiring.join(" ; ") : NOT_FOUND}`,
    `- Leur culture : ${r.pain.cultureKeywords.length ? r.pain.cultureKeywords.join(", ") : NOT_FOUND}`,
    "",
    "4. LE PLAN D'ATTAQUE",
    `- Offre à prioriser : ${v(r.attackPlan.priorityOffer)}${r.attackPlan.offerWhy ? ` (${r.attackPlan.offerWhy})` : ""}`,
    ...r.attackPlan.goldenQuestions.map((q, i) => `- Question ${i + 1} : ${q}`),
  ];
  if (r.clientReferences.length) {
    lines.push(
      "",
      "CLIENTS SIMILAIRES",
      ...r.clientReferences.map(
        (c) => `- ${c.client} (${c.theme}) : ${c.link}`,
      ),
    );
  }
  if (input.sources.length) {
    lines.push("", "SOURCES", ...input.sources.map((s) => `- ${s}`));
  }
  return lines.join("\n");
}
