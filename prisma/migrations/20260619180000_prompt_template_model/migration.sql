-- Per-prompt Vercel AI Gateway model selection (super admin).
ALTER TABLE "PromptTemplate" ADD COLUMN "model" TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini';
