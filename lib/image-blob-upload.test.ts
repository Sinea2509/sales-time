import { describe, expect, it } from "@jest/globals";
import { validateImageFile } from "@/lib/image-blob-upload";

describe("validateImageFile", () => {
  it("accepts supported image types under the size limit", () => {
    expect(
      validateImageFile(
        new File([new Uint8Array(100)], "a.png", { type: "image/png" }),
      ),
    ).toEqual({ ok: true, ext: "png" });
    expect(
      validateImageFile(
        new File([new Uint8Array(100)], "a.jpg", { type: "image/jpeg" }),
      ),
    ).toEqual({ ok: true, ext: "jpg" });
  });

  it("rejects empty files", () => {
    const result = validateImageFile(
      new File([], "empty.png", { type: "image/png" }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects files over the 2 Mo limit", () => {
    const tooBig = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", {
      type: "image/png",
    });
    expect(validateImageFile(tooBig).ok).toBe(false);
  });

  it("rejects unsupported mime types", () => {
    const result = validateImageFile(
      new File([new Uint8Array(100)], "a.pdf", { type: "application/pdf" }),
    );
    expect(result.ok).toBe(false);
  });
});
