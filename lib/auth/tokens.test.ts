import { describe, expect, it } from "@jest/globals";
import { generateOpaqueToken, hashToken } from "./tokens";

describe("tokens", () => {
  it("hashes deterministically", () => {
    const raw = "test-token";
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).not.toBe(hashToken(`${raw}x`));
  });

  it("generates opaque tokens", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a.length).toBeGreaterThan(20);
    expect(a).not.toBe(b);
  });
});
