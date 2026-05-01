"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  ONBOARDING_INVITE_ROLE_OPTIONS,
  type OnboardingInviteRow,
} from "@/lib/onboarding-invites";
import { teamInviteAddRowVioletButtonClass } from "@/lib/onboarding-invite-cta-class";
import { cn } from "@/lib/utils";

type Props = {
  rows: OnboardingInviteRow[];
  onRowsChange: (rows: OnboardingInviteRow[]) => void;
  label: string;
};

/**
 * Liste e-mail + rôle et bouton « + Ajouter une invitation » — même structure
 * que l’étape 4 de l’onboarding (réutilisable dans Paramètres équipe).
 */
export function TeamInviteRowsField({ rows, onRowsChange, label }: Props) {
  return (
    <div className="space-y-3">
      <Label className="text-foreground">{label}</Label>
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li
            key={`inv-row-${i}`}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              type="email"
              className="h-10 sm:flex-1"
              value={row.email}
              onChange={(e) => {
                const v = e.target.value;
                onRowsChange(
                  rows.map((r, j) => (j === i ? { ...r, email: v } : r)),
                );
              }}
              placeholder="collegue@entreprise.com"
              autoComplete="email"
            />
            <select
              className={cn(nativeSelectClassName, "h-10 sm:w-44 shrink-0")}
              value={row.role}
              onChange={(e) => {
                const role = e.target.value as OnboardingInviteRow["role"];
                onRowsChange(
                  rows.map((r, j) => (j === i ? { ...r, role } : r)),
                );
              }}
              aria-label="Rôle"
            >
              {ONBOARDING_INVITE_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        className={teamInviteAddRowVioletButtonClass}
        onClick={() => onRowsChange([...rows, { email: "", role: "MEMBER" }])}
      >
        + Ajouter une invitation
      </Button>
    </div>
  );
}
