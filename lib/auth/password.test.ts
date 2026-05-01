import { afterEach, describe, expect, it } from "@jest/globals";
import * as argon2 from "argon2";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("verifies a freshly hashed password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(
      true,
    );
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("returns false when verify throws", async () => {
    jest.spyOn(argon2, "verify").mockRejectedValueOnce(new Error("corrupt"));
    expect(await verifyPassword("any-hash", "pw")).toBe(false);
  });
});
