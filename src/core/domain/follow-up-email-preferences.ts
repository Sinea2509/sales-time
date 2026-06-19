export type FollowUpEmailTone = "formal" | "informal";

export type FollowUpEmailPreferenceSource = {
  emailTone: string | null;
  emailVouvoiement: boolean | null;
  emailSignature: string | null;
};

export type ResolvedFollowUpEmailPreferences = {
  emailTone: FollowUpEmailTone;
  emailVouvoiement: boolean;
  emailSignature: string | null;
};

function normalizeTone(raw: string | null | undefined): FollowUpEmailTone {
  return raw === "informal" ? "informal" : "formal";
}

/** Member overrides win when set; otherwise organization defaults apply. */
export function resolveFollowUpEmailPreferences(input: {
  organization: FollowUpEmailPreferenceSource | null;
  membership: FollowUpEmailPreferenceSource | null;
}): ResolvedFollowUpEmailPreferences {
  const org = input.organization;
  const member = input.membership;

  const emailTone = normalizeTone(
    member?.emailTone ?? org?.emailTone ?? "formal",
  );
  const emailVouvoiement =
    member?.emailVouvoiement ?? org?.emailVouvoiement ?? true;
  const emailSignature =
    member?.emailSignature ?? org?.emailSignature ?? null;

  return { emailTone, emailVouvoiement, emailSignature };
}

/** Persist only fields that differ from organization defaults (null = inherit). */
export function personalFollowUpEmailOverridesFromForm(input: {
  organization: FollowUpEmailPreferenceSource | null;
  form: ResolvedFollowUpEmailPreferences;
}): FollowUpEmailPreferenceSource {
  const orgDefaults = resolveFollowUpEmailPreferences({
    organization: input.organization,
    membership: null,
  });

  const signature = input.form.emailSignature?.trim() || null;
  const orgSignature = orgDefaults.emailSignature?.trim() || null;

  return {
    emailTone:
      input.form.emailTone === orgDefaults.emailTone ? null : input.form.emailTone,
    emailVouvoiement:
      input.form.emailVouvoiement === orgDefaults.emailVouvoiement
        ? null
        : input.form.emailVouvoiement,
    emailSignature: signature === orgSignature ? null : signature,
  };
}
