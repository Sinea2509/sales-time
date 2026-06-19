import { describe, expect, it } from "@jest/globals";
import { validateUserAvatarFile } from "@/lib/user-avatar-upload";

describe("validateUserAvatarFile", () => {
  it("accepts png under size limit", () => {
    const file = new File([new Uint8Array(100)], "a.png", { type: "image/png" });
    expect(validateUserAvatarFile(file)).toEqual({ ok: true, ext: "png" });
  });

  it("rejects unsupported mime types", () => {
    const file = new File([new Uint8Array(100)], "a.pdf", {
      type: "application/pdf",
    });
    expect(validateUserAvatarFile(file).ok).toBe(false);
  });
});
