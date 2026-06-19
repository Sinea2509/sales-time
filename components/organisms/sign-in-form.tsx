"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  signInAction,
  type SignInFieldErrors,
} from "@/app/[locale]/sign-in/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearSignInFormDraft,
  readSignInFormDraft,
  writeSignInFormDraft,
  type SignInFormDraft,
} from "@/lib/sign-in-form-draft";

type Props = {
  next?: string;
};

const emptyDraft = (): SignInFormDraft => ({ email: "", password: "" });

function subscribeToSignInDraft(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function fieldError(
  fieldErrors: SignInFieldErrors | undefined,
  field: keyof SignInFieldErrors,
): string | undefined {
  return fieldErrors?.[field];
}

export function SignInForm({ next }: Props) {
  const [state, formAction, pending] = useActionState(signInAction, null);
  const storedDraft = useSyncExternalStore(
    subscribeToSignInDraft,
    readSignInFormDraft,
    emptyDraft,
  );
  const [localDraft, setLocalDraft] = useState<SignInFormDraft | null>(null);
  const wasPending = useRef(false);

  const email = localDraft?.email ?? storedDraft.email;
  const password = localDraft?.password ?? storedDraft.password;

  function updateDraft(nextDraft: SignInFormDraft) {
    setLocalDraft(nextDraft);
    writeSignInFormDraft(nextDraft);
  }

  useEffect(() => {
    if (wasPending.current && !pending && state === null) {
      clearSignInFormDraft();
      setLocalDraft(null);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;
  const formMessage =
    state?.ok === false && !fieldErrors?.email && !fieldErrors?.password
      ? state.message
      : null;

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(e) =>
            updateDraft({ email: e.target.value, password })
          }
          aria-invalid={fieldError(fieldErrors, "email") ? true : undefined}
        />
        {fieldError(fieldErrors, "email") ? (
          <p className="text-destructive text-sm" role="alert">
            {fieldError(fieldErrors, "email")}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          value={password}
          onChange={(e) =>
            updateDraft({ email, password: e.target.value })
          }
          aria-invalid={fieldError(fieldErrors, "password") ? true : undefined}
        />
        {fieldError(fieldErrors, "password") ? (
          <p className="text-destructive text-sm" role="alert">
            {fieldError(fieldErrors, "password")}
          </p>
        ) : null}
      </div>
      {formMessage ? (
        <p className="text-destructive text-sm" role="alert">
          {formMessage}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
