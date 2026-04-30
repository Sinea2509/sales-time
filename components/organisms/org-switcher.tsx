"use client";

import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { switchOrganizationAction } from "@/app/[locale]/company/switch-organization-action";

export type OrgSwitcherMembership = {
  organizationId: string;
  name: string;
  role: string;
};

type Props = {
  memberships: OrgSwitcherMembership[];
  currentOrganizationId: string | null;
};

export function OrgSwitcher({ memberships, currentOrganizationId }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (memberships.length === 0) {
    return (
      <p className="text-sidebar-foreground/70 px-2 text-xs">
        Aucune organisation
      </p>
    );
  }

  return (
    <label className="group-data-[collapsible=icon]:hidden block px-2">
      <span className="sr-only">Organisation active</span>
      <select
        className="border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground w-full max-w-full rounded-lg border px-2 py-1.5 text-sm shadow-none"
        disabled={pending}
        value={currentOrganizationId ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          start(async () => {
            const r = await switchOrganizationAction(v);
            if (r.ok) router.refresh();
          });
        }}
      >
        <option value="" disabled>
          Choisir une organisation…
        </option>
        {memberships.map((m) => (
          <option key={m.organizationId} value={m.organizationId}>
            {m.name} ({m.role === "ADMIN" ? "admin" : "membre"})
          </option>
        ))}
      </select>
    </label>
  );
}
