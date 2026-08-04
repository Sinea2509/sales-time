"use client";

import { useActionState, useRef } from "react";
import { resetPasswordAction } from "@/app/[locale]/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const primaryCtaClass = cn(
  "text-brand-foreground h-10 w-full shrink-0 rounded-md border-0 px-6 font-medium shadow-sm",
  "bg-brand hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover",
);

type Props = {
  token: string;
};

export function ResetPasswordForm({ token }: Props) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    null,
  );
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  /*
    La non-correspondance des deux saisies se disait au retour du serveur,
    en message global. Le navigateur sait la dire au champ, en français,
    avant l'envoi : c'est lui qui bloque la soumission.
  */
  function verifieCorrespondance() {
    const confirm = confirmRef.current;
    if (!confirm) return;
    confirm.setCustomValidity(
      confirm.value && confirm.value !== passwordRef.current?.value
        ? "Les deux mots de passe ne correspondent pas."
        : "",
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          ref={passwordRef}
          onChange={verifieCorrespondance}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          ref={confirmRef}
          onChange={verifieCorrespondance}
        />
      </div>
      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className={primaryCtaClass} disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </Button>
    </form>
  );
}
