"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { forgotPasswordAction } from "@/app/[locale]/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

const primaryCtaClass = cn(
  "h-10 w-full shrink-0 rounded-md border-0 px-6 font-medium text-white shadow-sm",
  "bg-brand hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover",
);

function ResendRow() {
  const { pending } = useFormStatus();
  return (
    <p className="text-muted-foreground text-center text-sm">
      Vous n&apos;avez pas reçu le mail ?{" "}
      <button
        type="submit"
        disabled={pending}
        className="text-brand font-medium underline-offset-4 hover:underline disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Renvoyer"}
      </button>
    </p>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    null,
  );

  if (state?.ok === true) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-3 text-center">
          <h2 className={pageTitleClass}>Vérifiez votre e-mail</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nous vous avons envoyé un lien pour réinitialiser votre mot de
            passe.
          </p>
        </div>
        <Link
          href="/sign-in"
          className={cn(
            primaryCtaClass,
            "inline-flex items-center justify-center no-underline",
          )}
        >
          Compris
        </Link>
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="email" value={email} />
          <ResendRow />
        </form>
      </div>
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />
      </div>
      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className={primaryCtaClass} disabled={isPending}>
        {isPending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
