"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
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
  organizationName: string;
};

/**
 * L'inscription d'un invité, sur la page même de l'invitation.
 *
 * Un seul champ de mot de passe, avec un bouton pour l'afficher, plutôt que
 * deux champs à remplir à l'aveugle : c'est le mot de passe que l'invité
 * choisit, et c'est ici qu'il le choisit (retour du 20 octobre 2026, un invité
 * le cherchait dans un mail).
 */
export function JoinInvitationForm({
  token,
  inviteEmail,
  organizationName,
}: Props) {
  const [state, formAction, isPending] = useActionState<
    RegisterFromInvitationState,
    FormData
  >((_prev, fd) => registerFromInvitationAction(token, _prev, fd), null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4 text-left">
      {state?.ok === false ? (
        <p
          className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-3 py-2 text-sm"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="inviteEmail">Adresse e-mail</Label>
        <Input
          id="inviteEmail"
          value={inviteEmail}
          readOnly
          className="bg-muted/50 font-mono text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Choisissez votre mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={isPending}
            aria-describedby="password-hint"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <p id="password-hint" className="text-muted-foreground text-xs">
          8 caractères minimum. C&apos;est celui que vous utiliserez pour vous
          connecter.
        </p>
      </div>
      <Button
        type="submit"
        className="bg-brand text-brand-foreground hover:bg-brand-hover h-11 w-full"
        disabled={isPending}
      >
        {isPending
          ? "Création du compte…"
          : `Créer mon compte et rejoindre ${organizationName}`}
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Vous avez déjà un compte Sales Time ?{" "}
        <Link
          href={`/sign-in?next=/invitations/${encodeURIComponent(token)}`}
          className="text-primary underline"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
