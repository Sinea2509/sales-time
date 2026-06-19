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
