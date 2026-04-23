export type OnboardingInviteRole = "ADMIN" | "MEMBER";

export type OnboardingInviteRow = {
  email: string;
  role: OnboardingInviteRole;
};

export const ONBOARDING_INVITE_ROLE_OPTIONS: {
  value: OnboardingInviteRole;
  label: string;
}[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
];

function normalizeRole(raw: unknown): OnboardingInviteRole {
  if (raw === "ADMIN" || raw === "org:admin" || raw === "admin") return "ADMIN";
  return "MEMBER";
}

/** Reads legacy `string[]` or `{ email, role }[]` from JSON. */
export function parseStoredInviteRows(value: unknown): OnboardingInviteRow[] {
  if (!Array.isArray(value)) return [];
  const out: OnboardingInviteRow[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const email = item.trim();
      if (email.length > 0) {
        out.push({ email, role: "MEMBER" });
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
  role: "MEMBER",
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
