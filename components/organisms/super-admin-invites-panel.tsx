"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import {
  inviteSuperAdminAction,
  revokeSuperAdminInvitationAction,
  type SuperAdminInviteActionResult,
} from "@/app/[locale]/admin/super-admins/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SuperAdminInviteRow = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

type Props = {
  invitations: SuperAdminInviteRow[];
};

export function SuperAdminInvitesPanel({ invitations }: Props) {
  const router = useRouter();
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
  const [revokePending, startRevoke] = useTransition();

  useEffect(() => {
    if (inviteState?.ok === true) {
      router.refresh();
    }
  }, [inviteState, router]);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium">Inviter un super administrateur</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Envoi d&apos;un lien par e-mail. Réservé à l&apos;espace plateforme (
          <span className="font-mono">/admin</span>) — les invitations
          d&apos;organisation restent dans Paramètres → Équipe.
        </p>
        <form action={inviteAction} className="mt-4 flex max-w-md flex-col gap-3">
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
          {inviteState?.ok === false ? (
            <p className="text-destructive text-sm" role="alert">
              {inviteState.message}
            </p>
          ) : null}
          {inviteState?.ok === true ? (
            <p className="text-sm text-green-700 dark:text-green-400" role="status">
              Invitation envoyée.
            </p>
          ) : null}
          <Button type="submit" disabled={invitePending} className="w-fit">
            {invitePending ? "Envoi…" : "Envoyer l’invitation"}
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-border p-6">
        <h2 className="text-lg font-medium">Invitations en attente</h2>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">Aucune invitation.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
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
                  disabled={revokePending}
                  onClick={() => {
                    startRevoke(async () => {
                      const r = await revokeSuperAdminInvitationAction(inv.id);
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
      </section>
    </div>
  );
}
