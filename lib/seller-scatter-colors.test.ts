import { describe, expect, it } from "@jest/globals";
import {
  sellerScatterColorForIndex,
  sellerScatterStylesByUserId,
} from "./seller-scatter-colors";

describe("seller-scatter-colors", () => {
  it("cycles colors by index", () => {
    expect(sellerScatterColorForIndex(0)).toBe("#0ea5e9");
    expect(sellerScatterColorForIndex(10)).toBe("#0ea5e9");
  });

  it("assigns stable styles sorted by display name", () => {
    const styles = sellerScatterStylesByUserId([
      { sellerUserId: "u2", sellerDisplayName: "Lucas Bernard" },
      { sellerUserId: "u1", sellerDisplayName: "Emma Leroy" },
      { sellerUserId: "u2", sellerDisplayName: "Lucas Bernard" },
    ]);

    expect([...styles.keys()]).toEqual(["u1", "u2"]);
    expect(styles.get("u1")?.label).toBe("Emma Leroy");
    expect(styles.get("u2")?.label).toBe("Lucas Bernard");
    expect(styles.get("u1")?.color).not.toBe(styles.get("u2")?.color);
  });
});
