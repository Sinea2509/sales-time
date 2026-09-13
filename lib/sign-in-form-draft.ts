export type SignInFormDraft = {
  email: string;
  password: string;
};

const STORAGE_KEY = "sales-time:sign-in-draft";

export const EMPTY_SIGN_IN_FORM_DRAFT: SignInFormDraft = Object.freeze({
  email: "",
  password: "",
});

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: SignInFormDraft = EMPTY_SIGN_IN_FORM_DRAFT;

function canUseStorage(): boolean {
  return typeof globalThis.localStorage !== "undefined";
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function invalidateCache(): void {
  cachedRaw = undefined;
}

function parseDraft(raw: string | null): SignInFormDraft {
  if (!raw) {
    return EMPTY_SIGN_IN_FORM_DRAFT;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SignInFormDraft>;
    const email = typeof parsed.email === "string" ? parsed.email : "";
    const password = typeof parsed.password === "string" ? parsed.password : "";
    if (email === "" && password === "") {
      return EMPTY_SIGN_IN_FORM_DRAFT;
    }
    return { email, password };
  } catch {
    return EMPTY_SIGN_IN_FORM_DRAFT;
  }
}

function draftsEqual(a: SignInFormDraft, b: SignInFormDraft): boolean {
  return a.email === b.email && a.password === b.password;
}

/** useSyncExternalStore subscription: same-tab writes and cross-tab storage events. */
export function subscribeToSignInFormDraft(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Stable snapshot for useSyncExternalStore: same reference until stored values change. */
export function getSignInFormDraftSnapshot(): SignInFormDraft {
  if (!canUseStorage()) {
    return EMPTY_SIGN_IN_FORM_DRAFT;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSnapshot;
  }

  cachedRaw = raw;
  const next = parseDraft(raw);
  if (draftsEqual(next, cachedSnapshot)) {
    return cachedSnapshot;
  }

  cachedSnapshot =
    next === EMPTY_SIGN_IN_FORM_DRAFT ? EMPTY_SIGN_IN_FORM_DRAFT : next;
  return cachedSnapshot;
}

export function readSignInFormDraft(): SignInFormDraft {
  return getSignInFormDraftSnapshot();
}

export function writeSignInFormDraft(draft: SignInFormDraft): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    if (draft.email === "" && draft.password === "") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
    invalidateCache();
    notifyListeners();
  } catch {
    // Quota or private browsing: ignore.
  }
}

export function clearSignInFormDraft(): void {
  if (!canUseStorage()) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
    invalidateCache();
    notifyListeners();
  } catch {
    // Ignore.
  }
}

/** Test-only: reset in-memory snapshot cache between examples. */
export function resetSignInFormDraftCacheForTests(): void {
  cachedRaw = undefined;
  cachedSnapshot = EMPTY_SIGN_IN_FORM_DRAFT;
}
