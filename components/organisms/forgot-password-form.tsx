"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/app/[locale]/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null);

  if (state?.ok === true) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Si un compte existe, un e-mail avec un lien de réinitialisation vient
        d&apos;être envoyé.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
        />
      </div>
      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
