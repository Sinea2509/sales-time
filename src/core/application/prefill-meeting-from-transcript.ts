import {
  EMPTY_MEETING_PREFILL,
  sanitizeMeetingFactsSuggestion,
  transcriptExcerptForPrefill,
  type MeetingFactsSuggestion,
  type MeetingPrefill,
} from "@/src/core/domain/meeting-prefill";
import { transcriptHeaderFacts } from "@/src/core/domain/transcript-header";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";

/**
 * Le modèle rapide et bon marché des analyses : lire un nom, un type et une
 * issue dans le début et la fin d'une conversation ne demande pas plus.
 */
export const MEETING_PREFILL_MODEL = "anthropic/claude-haiku-5.5";

/** Au-delà, le commercial remplit lui-même : on ne le fait pas attendre. */
export const MEETING_PREFILL_TIMEOUT_MS = 20_000;

export const MEETING_PREFILL_SYSTEM_PROMPT = [
  "Tu lis le transcript d'un rendez-vous commercial pour préremplir sa fiche dans Sales Time.",
  "Le commercial vérifiera chaque champ : ne devine rien. Quand une information ne s'entend pas clairement dans la conversation, rends null.",
  "Le prospect est la personne rencontrée, pas le commercial. Écris son prénom et son nom tels qu'ils sont prononcés, sans titre ni fonction.",
  "Le type de rendez-vous doit être recopié exactement depuis la liste fournie, ou null.",
  "Le résultat se lit à la fin de l'échange : signature ou accord ferme, refus, suite prévue, rendez-vous qui n'a pas eu lieu.",
  "Le montant est celui de l'affaire discutée, en euros, s'il est cité ; jamais un chiffre d'affaires d'entreprise ni un budget hors sujet.",
].join("\n");

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * La fiche d'un rendez-vous préremplie à partir de sa conversation.
 *
 * La date et la durée viennent de l'en-tête de la transcription quand il y
 * en a un ; le prospect, le type, le résultat et le montant, du modèle. Un
 * modèle en panne ou trop lent ne bloque jamais le dépôt : la fiche reste
 * simplement à remplir.
 */
export async function prefillMeetingFromTranscript(
  deps: {
    analysis: AnalysisPort;
    model?: string;
    timeoutMs?: number;
    /** Faux quand la passerelle IA n'est pas configurée : l'en-tête seul. */
    useModel?: boolean;
  },
  input: { transcript: string; meetingTypeOptions: readonly string[] },
): Promise<MeetingPrefill> {
  const header = transcriptHeaderFacts(input.transcript);
  const base: MeetingPrefill = {
    ...EMPTY_MEETING_PREFILL,
    meetingDate: header.date,
    durationMin: header.durationMin,
  };
  if (deps.useModel === false) return base;

  let raw: MeetingFactsSuggestion;
  try {
    raw = await withTimeout(
      deps.analysis.suggestMeetingFacts({
        systemPrompt: MEETING_PREFILL_SYSTEM_PROMPT,
        model: deps.model ?? MEETING_PREFILL_MODEL,
        transcriptExcerpt: transcriptExcerptForPrefill(input.transcript),
        meetingTypeOptions: input.meetingTypeOptions,
      }),
      deps.timeoutMs ?? MEETING_PREFILL_TIMEOUT_MS,
    );
  } catch {
    return base;
  }

  return {
    ...base,
    ...sanitizeMeetingFactsSuggestion(raw, input.meetingTypeOptions),
  };
}
