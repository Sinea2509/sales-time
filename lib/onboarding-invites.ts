export type OnboardingInviteRole = "org:admin" | "org:member";

export type OnboardingInviteRow = {
  email: string;
  role: OnboardingInviteRole;
};

export const ONBOARDING_INVITE_ROLE_OPTIONS: {
  value: OnboardingInviteRole;
  label: string;
}[] = [
  { value: "org:admin", label: "Admin" },
  { value: "org:member", label: "Member" },
];

function normalizeRole(raw: unknown): OnboardingInviteRole {
  if (raw === "org:admin" || raw === "admin") return "org:admin";
  return "org:member";
}

/** Reads legacy `string[]` or `{ email, role }[]` from JSON. */
export function parseStoredInviteRows(value: unknown): OnboardingInviteRow[] {
  if (!Array.isArray(value)) return [];
  const out: OnboardingInviteRow[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const email = item.trim();
      if (email.length > 0) {
        out.push({ email, role: "org:member" });
      }
      continue;
    }
    if (item && typeof item === "object") {
      const email = String(
        (item as { email?: unknown }).email ?? "",
      ).trim();
      if (email.length === 0) continue;
      out.push({
        email,
        role: normalizeRole((item as { role?: unknown }).role),
      });
    }
  }
  return out;
}

const emptyRow = (): OnboardingInviteRow => ({
  email: "",
  role: "org:member",
});

/** When nothing is saved yet, show three empty rows; otherwise restore saved invites. */
export function initialInviteRowsFromStored(
  parsed: OnboardingInviteRow[],
): OnboardingInviteRow[] {
  if (parsed.length === 0) {
    return [emptyRow(), emptyRow(), emptyRow()];
  }
  return parsed.map((r) => ({
    email: r.email,
    role: r.role,
  }));
}
