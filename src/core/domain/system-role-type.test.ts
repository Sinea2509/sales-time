import { describe, expect, it } from "@jest/globals";
import { SYSTEM_ROLE_TYPES } from "./system-role-type";

describe("system-role-type", () => {
  it("lists system role constants", () => {
    expect(SYSTEM_ROLE_TYPES).toEqual(["SUPER_ADMIN"]);
  });
});
