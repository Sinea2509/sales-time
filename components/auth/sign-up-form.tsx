"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "@/app/[locale]/sign-up/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 w-full bg-brand text-white hover:bg-brand-hover sm:w-auto"
    >
      {pending ? "Création…" : "Créer mon compte"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-mail professionnel</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Site web de l&apos;entreprise</Label>
        <Input
          id="website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="ex. monentreprise.fr ou https://www.monentreprise.fr"
          required
          disabled={pending}
          className="h-10"
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Une seule organisation par domaine (normalisé sans www, en
          minuscules).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          className="h-10"
        />
        <p className="text-muted-foreground text-xs">Au moins 8 caractères.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={pending}
          className="h-10"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
