/** Options des listes — étape 1 « Contexte » (onboarding). */

export const ONBOARDING_INDUSTRY_OPTIONS = [
  { value: "saas_tech", label: "SaaS & Tech" },
  { value: "services_b2b", label: "Services B2B" },
  { value: "industrie", label: "Industrie & manufacturing" },
  { value: "commerce", label: "Commerce & distribution" },
] as const;

export const ONBOARDING_TEAM_SIZE_OPTIONS = [
  { value: "1_2", label: "1–2 commerciaux" },
  { value: "3_5", label: "3–5 commerciaux" },
  { value: "6_15", label: "6–15 commerciaux" },
  { value: "16_plus", label: "16+ commerciaux" },
] as const;

export const ONBOARDING_SALES_CYCLE_OPTIONS = [
  { value: "lt_30d", label: "Moins de 30 jours" },
  { value: "1_3m", label: "1 à 3 mois" },
  { value: "3_6m", label: "3 à 6 mois" },
  { value: "6_12m", label: "6 à 12 mois" },
  { value: "gt_12m", label: "Plus de 12 mois" },
] as const;

export const ONBOARDING_DEAL_SIZE_OPTIONS = [
  { value: "lt_5k", label: "Moins de 5 000 €" },
  { value: "5k_15k", label: "5 000 € – 15 000 €" },
  { value: "15k_50k", label: "15 000 € – 50 000 €" },
  { value: "50k_200k", label: "50 000 € – 200 000 €" },
  { value: "gt_200k", label: "Plus de 200 000 €" },
] as const;
