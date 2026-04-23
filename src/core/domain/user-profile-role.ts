export const USER_PROFILE_ROLES = [
  "COMMERCIAL",
  "SALES_MANAGER",
  "LEADERSHIP",
  "OTHER",
] as const;

export type UserProfileRole = (typeof USER_PROFILE_ROLES)[number];
