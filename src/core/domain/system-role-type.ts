export const SYSTEM_ROLE_TYPES = ["SUPER_ADMIN"] as const;

export type SystemRoleType = (typeof SYSTEM_ROLE_TYPES)[number];
