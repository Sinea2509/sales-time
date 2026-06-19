"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteMemberAction } from "@/app/[locale]/company/settings/equipe/actions";
import { BrandCtaButton } from "@/components/molecules/brand-cta-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ONBOARDING_INVITE_ROLE_OPTIONS } from "@/lib/onboarding-invites";
import { cn } from "@/lib/utils";
import type { OrganizationMembershipRole } from "@/src/core/domain/organization-membership-role";

type TeamMemberInviteDialogProps = {
  currentUserEmail: string;
  canChooseInviteRole?: boolean;
  className?: string;
};

export function TeamMemberInviteDialog({
  currentUserEmail,
  canChooseInviteRole = true,
  className,
}: TeamMemberInviteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationMembershipRole>("MEMBER");
  const [message, setMessage] = useState<string | null>(null);

  function resetForm() {
    setEmail("");
    setRole("MEMBER");
    setMessage(null);
  }

  function closeDialog() {
    setOpen(false);
    resetForm();
  }

  function submitInvitation() {
    setMessage(null);
    startTransition(async () => {
      const normalized = email.trim().toLowerCase();
      if (!normalized) {
        setMessage("Saisissez une adresse e-mail.");
        return;
      }
      if (normalized === currentUserEmail.trim().toLowerCase()) {
        setMessage("Vous ne pouvez pas vous inviter vous-même.");
        return;
      }

      const result = await inviteMemberAction({
        email: email.trim(),
        role: canChooseInviteRole ? role : "MEMBER",
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  return (
    <>
      <BrandCtaButton
        onClick={() => setOpen(true)}
        className={cn("gap-1", className)}
      >
        <span className="text-lg leading-none">+</span>
        Ajouter un membre
      </BrandCtaButton>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Invitez un collègue par e-mail et choisissez son rôle dans
              l&apos;organisation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-invite-email">E-mail</Label>
              <Input
                id="team-invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collegue@entreprise.com"
                autoComplete="email"
                disabled={pending}
              />
            </div>

            {canChooseInviteRole ? (
              <div className="space-y-2">
                <Label htmlFor="team-invite-role">Rôle</Label>
                <Select
                  value={role}
                  onValueChange={(value: string | null) => {
                    if (value === "ADMIN" || value === "MEMBER") {
                      setRole(value);
                    }
                  }}
                >
                  <SelectTrigger id="team-invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ONBOARDING_INVITE_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {message ? (
              <p className="text-destructive text-sm" role="alert">
                {message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="button" disabled={pending} onClick={submitInvitation}>
              {pending ? "Envoi…" : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
