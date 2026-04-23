export const REGISTER_PROFILE_ROLE_OPTIONS = [
  { value: "COMMERCIAL", label: "Commercial(e)" },
  { value: "SALES_MANAGER", label: "Manager commercial" },
  { value: "LEADERSHIP", label: "Direction / C-level" },
  { value: "OTHER", label: "Autre" },
] as const;

export type RegisterProfileRoleValue =
  (typeof REGISTER_PROFILE_ROLE_OPTIONS)[number]["value"];
