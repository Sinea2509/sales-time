/** Valeurs initiales alignées sur le PDF « Onboarding admin ». */
export const DEFAULT_MEETING_TYPES = [
  "Qualification",
  "Découverte",
  "Démo",
  "Proposition",
  "Négociation",
  "Closing",
  "Revue de compte",
] as const;

export const DEFAULT_PIPELINE_STAGES = [
  "Lead entrant",
  "Qualifié",
  "Démo / Proposition",
  "Négociation",
  "Gagné",
] as const;

export { DEFAULT_INVITE_MESSAGE_HTML as DEFAULT_INVITE_MESSAGE } from "@/lib/invite-email-html";
