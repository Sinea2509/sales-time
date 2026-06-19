"use client";

import { useState, useTransition } from "react";
import { enterSuperAdminOrganizationAction } from "@/app/[locale]/company/super-admin-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  organizationMembershipRoleLabel,
  type OrganizationMembershipRole,
} from "@/src/core/domain/organization-membership-role";

type Props = {
  targetOrganizationId: string;
  organizationName?: string;
  reason?: string | null;
  disabled?: boolean;
  buttonLabel: string;
  pendingLabel?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  buttonSize?: React.ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
};

export function SuperAdminEnterOrgButton({
  targetOrganizationId,
  organizationName,
  reason = null,
  disabled = false,
  buttonLabel,
  pendingLabel = "Entrée…",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<OrganizationMembershipRole>("ADMIN");
  const [pending, startTransition] = useTransition();

  function confirmEnter() {
    startTransition(async () => {
      await enterSuperAdminOrganizationAction({
        targetOrganizationId,
        role,
        reason,
      });
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={buttonClassName}
        disabled={disabled || pending}
        onClick={() => setOpen(true)}
      >
        {pending ? pendingLabel : buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir un rôle</DialogTitle>
            <DialogDescription>
              {organizationName
                ? `Entrer dans ${organizationName} avec le rôle sélectionné.`
                : "Sélectionnez le rôle avec lequel vous opérez dans cette organisation."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`super-admin-enter-role-${targetOrganizationId}`}>
              Rôle dans l&apos;organisation
            </Label>
            <select
              id={`super-admin-enter-role-${targetOrganizationId}`}
              className={nativeSelectClassName}
              value={role}
              disabled={pending}
              onChange={(e) =>
                setRole(e.target.value as OrganizationMembershipRole)
              }
            >
              <option value="ADMIN">
                {organizationMembershipRoleLabel("ADMIN")}
              </option>
              <option value="MEMBER">
                {organizationMembershipRoleLabel("MEMBER")}
              </option>
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="button" disabled={pending} onClick={confirmEnter}>
              {pending ? pendingLabel : "Entrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type SuperAdminEnterOrgRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetOrganizationId: string;
  organizationName?: string;
  reason?: string | null;
};

/** Controlled dialog for flows that already manage open state (e.g. command palette). */
export function SuperAdminEnterOrgRoleDialog({
  open,
  onOpenChange,
  targetOrganizationId,
  organizationName,
  reason = null,
}: SuperAdminEnterOrgRoleDialogProps) {
  const [role, setRole] = useState<OrganizationMembershipRole>("ADMIN");
  const [pending, startTransition] = useTransition();

  function confirmEnter() {
    startTransition(async () => {
      const result = await enterSuperAdminOrganizationAction({
        targetOrganizationId,
        role,
        reason,
      });
      if (result && !result.ok) {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir un rôle</DialogTitle>
          <DialogDescription>
            {organizationName
              ? `Entrer dans ${organizationName} avec le rôle sélectionné.`
              : "Sélectionnez le rôle avec lequel vous opérez dans cette organisation."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="super-admin-enter-role-dialog">Rôle</Label>
          <select
            id="super-admin-enter-role-dialog"
            className={nativeSelectClassName}
            value={role}
            disabled={pending}
            onChange={(e) =>
              setRole(e.target.value as OrganizationMembershipRole)
            }
          >
            <option value="ADMIN">
              {organizationMembershipRoleLabel("ADMIN")}
            </option>
            <option value="MEMBER">
              {organizationMembershipRoleLabel("MEMBER")}
            </option>
          </select>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" disabled={pending} onClick={confirmEnter}>
            {pending ? "Entrée…" : "Entrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
