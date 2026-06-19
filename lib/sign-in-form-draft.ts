export type SignInFormDraft = {
  email: string;
  password: string;
};

const STORAGE_KEY = "sales-time:sign-in-draft";

const emptyDraft = (): SignInFormDraft => ({ email: "", password: "" });

function canUseStorage(): boolean {
  return typeof globalThis.localStorage !== "undefined";
}

export function readSignInFormDraft(): SignInFormDraft {
  if (!canUseStorage()) {
    return emptyDraft();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyDraft();
    }
    const parsed = JSON.parse(raw) as Partial<SignInFormDraft>;
    return {
      email: typeof parsed.email === "string" ? parsed.email : "",
      password: typeof parsed.password === "string" ? parsed.password : "",
    };
  } catch {
    return emptyDraft();
  }
}

export function writeSignInFormDraft(draft: SignInFormDraft): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota or private browsing — ignore.
  }
}

export function clearSignInFormDraft(): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
