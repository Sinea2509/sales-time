import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";

export interface AnalysisPort {
  analyzeSoncas(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: SoncasAnalysisResult; rawText?: string }>;

  analyzeDisc(input: {
    systemMarkdown: string;
    transcript: string;
    notes: string | null;
    model: string;
  }): Promise<{ result: DiscAnalysisResult; rawText?: string }>;
}
