/** Canonical audit action codes stored in SuperAdminAuditLog.action */
export const PLATFORM_AUDIT_ACTIONS = [
  "ENTER_ORGANIZATION",
  "EXIT_ORGANIZATION",
  "PUBLISH_PROMPT",
  "RESTORE_PROMPT",
  "UPDATE_PROMPT_MODEL",
  "PUBLISH_KISS_QUADRANT_PROMPTS",
  "CREATE_ORGANIZATION",
  "UPDATE_ORGANIZATION",
  "DELETE_ORGANIZATION",
  "BLOCK_USER",
  "UNBLOCK_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "INVITE_USER_TO_ORG",
  "INVITE_SUPER_ADMIN",
  "REVOKE_SUPER_ADMIN",
  "REVOKE_SUPER_ADMIN_INVITE",
  "UPDATE_FEEDBACK",
  "REPLAY_AI_LOG",
  "USER_SIGN_UP",
  "USER_JOIN_ORGANIZATION",
  "ORG_CREATED",
  "CREATE_MEETING",
] as const;

export type PlatformAuditAction = (typeof PLATFORM_AUDIT_ACTIONS)[number];

export const PLATFORM_AUDIT_ACTION_LABELS: Record<string, string> = {
  ENTER_ORGANIZATION: "Entrer dans org",
  EXIT_ORGANIZATION: "Quitter org",
  ENTER_ORG: "Entrer dans org",
  EXIT_ORG: "Quitter org",
  PUBLISH_PROMPT: "Publier prompt",
  RESTORE_PROMPT: "Restaurer prompt",
  UPDATE_PROMPT_MODEL: "Modifier modèle IA",
  PUBLISH_KISS_QUADRANT_PROMPTS: "Consignes KISS (plateforme)",
  CREATE_ORGANIZATION: "Créer org (admin)",
  UPDATE_ORGANIZATION: "Modifier org (admin)",
  DELETE_ORGANIZATION: "Supprimer org (admin)",
  BLOCK_USER: "Bloquer utilisateur",
  UNBLOCK_USER: "Débloquer utilisateur",
  UPDATE_USER: "Modifier utilisateur",
  DELETE_USER: "Supprimer utilisateur",
  INVITE_USER_TO_ORG: "Inviter dans org",
  INVITE_SUPER_ADMIN: "Inviter super admin",
  REVOKE_SUPER_ADMIN: "Révoquer super admin",
  REVOKE_SUPER_ADMIN_INVITE: "Annuler invitation super admin",
  UPDATE_FEEDBACK: "Traiter feedback",
  REPLAY_AI_LOG: "Rejouer appel IA",
  USER_SIGN_UP: "Inscription utilisateur",
  USER_JOIN_ORGANIZATION: "Rejoindre une org",
  ORG_CREATED: "Création org (onboarding)",
  CREATE_MEETING: "Créer rendez-vous",
};

export const SYSTEM_AUDIT_ORG_ID = "system";
export const GLOBAL_AUDIT_ORG_ID = "__global__";

export function resolveAuditOrganizationLabel(
  organizationId: string,
  organizationName: string | null,
): string {
  if (organizationId === SYSTEM_AUDIT_ORG_ID) return "Système";
  if (organizationId === GLOBAL_AUDIT_ORG_ID) return "Plateforme (global)";
  return organizationName ?? organizationId;
}
