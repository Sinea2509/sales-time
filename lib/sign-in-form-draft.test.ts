import {
  clearSignInFormDraft,
  readSignInFormDraft,
  resetSignInFormDraftCacheForTests,
  writeSignInFormDraft,
} from "@/lib/sign-in-form-draft";

function createStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe("sign-in-form-draft", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorage(),
    });
    resetSignInFormDraftCacheForTests();
  });

  it("returns empty draft when nothing is stored", () => {
    expect(readSignInFormDraft()).toEqual({ email: "", password: "" });
  });

  it("round-trips email and password", () => {
    writeSignInFormDraft({ email: "user@acme.co", password: "secret" });
    expect(readSignInFormDraft()).toEqual({
      email: "user@acme.co",
      password: "secret",
    });
  });

  it("clears stored draft", () => {
    writeSignInFormDraft({ email: "user@acme.co", password: "secret" });
    clearSignInFormDraft();
    expect(readSignInFormDraft()).toEqual({ email: "", password: "" });
  });

  it("ignores malformed stored JSON", () => {
    localStorage.setItem("sales-time:sign-in-draft", "{not-json");
    expect(readSignInFormDraft()).toEqual({ email: "", password: "" });
  });

  it("returns the same snapshot reference when storage is unchanged", () => {
    writeSignInFormDraft({ email: "user@acme.co", password: "secret" });
    const first = readSignInFormDraft();
    const second = readSignInFormDraft();
    expect(first).toBe(second);
  });
});
