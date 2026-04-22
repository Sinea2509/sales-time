import { generateObject } from "ai";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/lib/analysis-result-zod";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";

export class VercelAIAnalysisAdapter implements AnalysisPort {
  async analyzeSoncas(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }) {
    const userPrompt = [
      `Transcript:\n${input.transcript}`,
      input.notes ? `\nNotes:\n${input.notes}` : "",
    ].join("");

    const { object } = await generateObject({
      model: input.model,
      schema: soncasResultSchema,
      system: input.systemMarkdown,
      prompt: userPrompt,
    });

    return { result: object };
  }

  async analyzeDisc(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }) {
    const userPrompt = [
      `Transcript:\n${input.transcript}`,
      input.notes ? `\nNotes:\n${input.notes}` : "",
    ].join("");

    const { object } = await generateObject({
      model: input.model,
      schema: discResultSchema,
      system: input.systemMarkdown,
      prompt: userPrompt,
    });

    return { result: object };
  }
}
