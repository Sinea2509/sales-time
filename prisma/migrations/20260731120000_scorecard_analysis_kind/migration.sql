-- Scorecard de rendez-vous (grille de critères notés de 0 à 4).
ALTER TYPE "AnalysisKind" ADD VALUE IF NOT EXISTS 'SCORECARD';
ALTER TYPE "AiCallKind" ADD VALUE IF NOT EXISTS 'SCORECARD';
