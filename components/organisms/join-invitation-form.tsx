"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  registerFromInvitationAction,
  type RegisterFromInvitationState,
} from "@/app/[locale]/invitations/[token]/join/actions";

type Props = {
  token: string;
  inviteEmail: string;
};

export function JoinInvitationForm({ token, inviteEmail }: Props) {
  const [state, formAction, isPending] = useActionState<
    RegisterFromInvitationState,
    FormData
  >((_prev, fd) => registerFromInvitationAction(token, _prev, fd), null);

  return (
    <form action={formAction} className="mt-6 space-y-4 text-left">
      {state?.ok === false ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-3 py-2 text-sm"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <p className="text-muted-foreground text-xs">
        Compte pour{" "}
        <span className="font-mono text-foreground">{inviteEmail}</span>
      </p>
      <div className="space-y-2">
        <Label htmlFor="firstName">Prénom</Label>
        <Input
          id="firstName"
          name="firstName"
          required
          autoComplete="given-name"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Nom</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          autoComplete="family-name"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          disabled={isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Création du compte…" : "Créer mon compte et rejoindre"}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        <Link
          href={`/sign-in?next=/invitations/${encodeURIComponent(token)}`}
          className="text-primary underline"
        >
          J’ai déjà un compte
        </Link>
      </p>
    </form>
  );
}
