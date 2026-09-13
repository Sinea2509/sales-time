import { z } from "zod";

/** Schéma formulaire complet (validation serveur, ex. super admin). */
const kissAudienceLinesFullSchema = z.object({
  global: z.string().max(8000),
  manager: z.string().max(8000),
  commercial: z.string().max(8000),
});

export const kissCoachingPromptsFullFormSchema = z.object({
  keep: kissAudienceLinesFullSchema,
  improve: kissAudienceLinesFullSchema,
  start: kissAudienceLinesFullSchema,
  stop: kissAudienceLinesFullSchema,
});

const kissAudienceLinesSchema = z.object({
  global: z.string().max(8000).optional(),
  manager: z.string().max(8000).optional(),
  commercial: z.string().max(8000).optional(),
});

export const kissCoachingPromptsJsonSchema = z.object({
  keep: kissAudienceLinesSchema.optional(),
  improve: kissAudienceLinesSchema.optional(),
  start: kissAudienceLinesSchema.optional(),
  stop: kissAudienceLinesSchema.optional(),
});

export type KissCoachingPromptsJson = z.infer<
  typeof kissCoachingPromptsJsonSchema
>;

export type KissQuadrantKey = "keep" | "improve" | "start" | "stop";

export type KissQuadrantAudienceLines = {
  global: string;
  manager: string;
  commercial: string;
};

export type KissCoachingPromptsForm = Record<
  KissQuadrantKey,
  KissQuadrantAudienceLines
>;

const QUADRANT_ORDER: KissQuadrantKey[] = ["keep", "improve", "start", "stop"];

const emptyAudienceLines = (): KissQuadrantAudienceLines => ({
  global: "",
  manager: "",
  commercial: "",
});

export function emptyKissCoachingPromptsForm(): KissCoachingPromptsForm {
  return {
    keep: emptyAudienceLines(),
    improve: emptyAudienceLines(),
    start: emptyAudienceLines(),
    stop: emptyAudienceLines(),
  };
}

const QUADRANT_LABEL_FR: Record<KissQuadrantKey, string> = {
  keep: "Keep",
  improve: "Improve",
  start: "Start",
  stop: "Stop",
};

function mergeAudience(
  raw: z.infer<typeof kissAudienceLinesSchema> | undefined,
): KissQuadrantAudienceLines {
  return {
    global: raw?.global?.trim() ?? "",
    manager: raw?.manager?.trim() ?? "",
    commercial: raw?.commercial?.trim() ?? "",
  };
}

/** Normalise le JSON stocké (partiel) vers le modèle formulaire. */
export function kissCoachingPromptsFromJson(
  raw: unknown,
): KissCoachingPromptsForm {
  const parsed = kissCoachingPromptsJsonSchema.safeParse(raw ?? {});
  const base = emptyKissCoachingPromptsForm();
  if (!parsed.success) return base;
  const d = parsed.data;
  for (const k of QUADRANT_ORDER) {
    base[k] = mergeAudience(d[k]);
  }
  return base;
}

/** Sérialise pour la base : `null` si tout est vide. */
export function kissCoachingPromptsToJson(
  form: KissCoachingPromptsForm,
): KissCoachingPromptsJson | null {
  const out: KissCoachingPromptsJson = {};
  for (const k of QUADRANT_ORDER) {
    const q = form[k];
    const block: {
      global?: string;
      manager?: string;
      commercial?: string;
    } = {};
    if (q.global.trim()) block.global = q.global.trim();
    if (q.manager.trim()) block.manager = q.manager.trim();
    if (q.commercial.trim()) block.commercial = q.commercial.trim();
    if (Object.keys(block).length > 0) {
      out[k] = block;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

/**
 * Texte markdown à ajouter au prompt système KISS (analyse RDV) ou à la synthèse manager.
 * `audience` sélectionne quelles lignes « manager » / « commercial » inclure en plus du global.
 */
export function buildKissOrgMarkdownAppendix(
  form: KissCoachingPromptsForm | null,
  audience: "commercial" | "manager",
): string {
  if (!form) return "";
  const parts: string[] = [];
  for (const k of QUADRANT_ORDER) {
    const q = form[k];
    const g = q.global.trim();
    const m = q.manager.trim();
    const c = q.commercial.trim();
    const audienceLine = audience === "manager" ? m : c;
    if (!g && !audienceLine) continue;
    const lines: string[] = [`### KISS · ${QUADRANT_LABEL_FR[k]}`];
    if (g) lines.push("", g);
    if (audienceLine) {
      lines.push(
        "",
        audience === "manager"
          ? "**Lecture manager (organisation)**"
          : "**Lecture commercial (organisation)**",
        audienceLine,
      );
    }
    parts.push(lines.join("\n"));
  }
  return parts.length > 0 ? parts.join("\n\n") : "";
}
