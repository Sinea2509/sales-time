"use client";

import { useState, useEffect, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  inviteSuperAdminAction,
  revokeSuperAdminInvitationAction,
  revokeSuperAdminRoleAction,
  type SuperAdminInviteActionResult,
} from "@/app/[locale]/admin/super-admins/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

export type SuperAdminRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  grantedAt: string;
};

export type SuperAdminInviteRow = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

type Props = {
  currentUserId: string;
  superAdmins: SuperAdminRow[];
  invitations: SuperAdminInviteRow[];
};

function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) return firstName[0].toUpperCase();
  return email[0].toUpperCase();
}

function getFullName(
  firstName: string | null,
  lastName: string | null,
): string | null {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return null;
}

export function SuperAdminInvitesPanel({
  currentUserId,
  superAdmins,
  invitations,
}: Props) {
  const router = useRouter();
  const [revokeTarget, setRevokeTarget] = useState<SuperAdminRow | null>(null);
  const [revokeRolePending, startRevokeRole] = useTransition();
  const [revokeInvPending, startRevokeInv] = useTransition();
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const [inviteState, inviteAction, invitePending] = useActionState(
    async (
      _prev: SuperAdminInviteActionResult | null,
      formData: FormData,
    ): Promise<SuperAdminInviteActionResult | null> => {
      const email = formData.get("email");
      return inviteSuperAdminAction({
        email: typeof email === "string" ? email : "",
      });
    },
    null,
  );

  useEffect(() => {
    if (inviteState?.ok === true) {
      router.refresh();
    }
  }, [inviteState, router]);

  function handleRevokeRole() {
    if (!revokeTarget) return;
    setRevokeError(null);
    startRevokeRole(async () => {
      const result = await revokeSuperAdminRoleAction(revokeTarget.userId);
      if (result.ok) {
        setRevokeTarget(null);
        router.refresh();
      } else {
        setRevokeError(result.message);
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Current super admins */}
      <Card>
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Super administrateurs actuels
          </CardTitle>
          <CardDescription>
            Utilisateurs disposant de l&apos;accès plateforme complet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {superAdmins.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun super administrateur.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {superAdmins.map((admin) => {
                const isSelf = admin.userId === currentUserId;
                const fullName = getFullName(admin.firstName, admin.lastName);
                return (
                  <li
                    key={admin.userId}
                    className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                          isSelf
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {getInitials(
                          admin.firstName,
                          admin.lastName,
                          admin.email,
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {fullName ?? admin.email}
                          {isSelf && (
                            <span className="text-muted-foreground ml-1.5 font-normal">
                              (vous)
                            </span>
                          )}
                        </p>
                        {fullName && (
                          <p className="text-muted-foreground truncate text-xs">
                            {admin.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">Super Admin</Badge>
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        Depuis le{" "}
                        {new Date(admin.grantedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          className={cn(
                            !isSelf &&
                              "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
                          )}
                          title={
                            isSelf
                              ? "Vous ne pouvez pas révoquer votre propre rôle"
                              : "Révoquer le rôle super admin"
                          }
                          onClick={() => setRevokeTarget(admin)}
                        >
                          Révoquer
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Inviter un super administrateur
          </CardTitle>
          <CardDescription>
            Envoi d&apos;un lien par e-mail. Réservé à l&apos;espace plateforme
            (<span className="font-mono text-xs">/admin</span>). Les invitations
            d&apos;organisation restent dans Paramètres → Équipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={inviteAction} className="flex max-w-md flex-col gap-3">
            <div className="space-y-2">
              <Label htmlFor="super-admin-invite-email">E-mail</Label>
              <Input
                id="super-admin-invite-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                disabled={invitePending}
                placeholder="collegue@entreprise.com"
              />
            </div>
            {inviteState?.ok === false && (
              <p className="text-destructive text-sm" role="alert">
                {inviteState.message}
              </p>
            )}
            {inviteState?.ok === true && (
              <p
                className="text-sm text-green-700 dark:text-green-400"
                role="status"
              >
                Invitation envoyée.
              </p>
            )}
            <Button type="submit" disabled={invitePending} className="w-fit">
              {invitePending ? "Envoi…" : "Envoyer l'invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      <Card>
        <CardHeader>
          <CardTitle className={cardTitleClass}>
            Invitations en attente
          </CardTitle>
          <CardDescription>
            Invitations envoyées mais pas encore acceptées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune invitation en attente.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-mono text-sm">{inv.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Expire le{" "}
                      {new Date(inv.expiresAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokeInvPending}
                    onClick={() => {
                      startRevokeInv(async () => {
                        const r = await revokeSuperAdminInvitationAction(
                          inv.id,
                        );
                        if (r.ok) router.refresh();
                      });
                    }}
                  >
                    Révoquer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Revoke confirmation dialog */}
      <Dialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null);
            setRevokeError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Révoquer le rôle super admin</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer le rôle super administrateur à{" "}
              <strong>
                {revokeTarget
                  ? (getFullName(
                      revokeTarget.firstName,
                      revokeTarget.lastName,
                    ) ?? revokeTarget.email)
                  : ""}
              </strong>{" "}
              ? Cette action est immédiate.
            </DialogDescription>
          </DialogHeader>
          {revokeError && (
            <p className="text-destructive text-sm" role="alert">
              {revokeError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevokeTarget(null);
                setRevokeError(null);
              }}
              disabled={revokeRolePending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeRole}
              disabled={revokeRolePending}
            >
              {revokeRolePending ? "Révocation…" : "Confirmer la révocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
