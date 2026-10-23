-- Fonctionnalités réservées à certaines organisations (ex. blocs Pipedrive de Sinéa).
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "enabledFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
