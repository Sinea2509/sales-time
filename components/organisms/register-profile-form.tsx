"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { REGISTER_PROFILE_ROLE_OPTIONS } from "@/lib/register-profile-options";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  completeRegisterProfile,
  type CompleteRegisterProfileResult,
} from "@/app/[locale]/register/profile/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 w-full bg-brand text-brand-foreground hover:bg-brand-hover sm:w-auto"
    >
      Continuer vers l&apos;onboarding
    </Button>
  );
}

type RegisterProfileFormProps = {
  defaultFirstName?: string | null;
  defaultLastName?: string | null;
};

export function RegisterProfileForm({
  defaultFirstName,
  defaultLastName,
}: RegisterProfileFormProps) {
  const [state, formAction] = useActionState<
    CompleteRegisterProfileResult | undefined,
    FormData
  >(completeRegisterProfile, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.ok === false ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="firstName">Prénom</Label>
        <Input
          id="firstName"
          name="firstName"
          required
          autoComplete="given-name"
          maxLength={80}
          className="h-10"
          defaultValue={defaultFirstName ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">Nom</Label>
        <Input
          id="lastName"
          name="lastName"
          required
          autoComplete="family-name"
          maxLength={80}
          className="h-10"
          defaultValue={defaultLastName ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profileRole">Votre rôle</Label>
        <select
          id="profileRole"
          name="profileRole"
          required
          className={cn(nativeSelectClassName, "h-10")}
          defaultValue=""
        >
          <option value="" disabled>
            Sélectionnez un rôle
          </option>
          {REGISTER_PROFILE_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton />
    </form>
  );
}
