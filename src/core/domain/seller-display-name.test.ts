import { describe, expect, it } from "@jest/globals";
import { sellerDisplayNameFromMeetingRow } from "./seller-display-name";

describe("sellerDisplayNameFromMeetingRow", () => {
  it("joins first and last name", () => {
    expect(
      sellerDisplayNameFromMeetingRow({
        sellerFirstName: "Sophie",
        sellerLastName: "Martin",
        sellerEmail: "sophie@example.com",
      }),
    ).toBe("Sophie Martin");
  });

  it("falls back to email then default label", () => {
    expect(
      sellerDisplayNameFromMeetingRow({
        sellerFirstName: null,
        sellerLastName: null,
        sellerEmail: "sophie@example.com",
      }),
    ).toBe("sophie@example.com");
    expect(
      sellerDisplayNameFromMeetingRow({
        sellerFirstName: null,
        sellerLastName: null,
        sellerEmail: null,
      }),
    ).toBe("Commercial");
  });
});
