import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_TRIAL_LIMIT,
  filterRowsByTeamUserIds,
  resolveManagerTeamUserIds,
} from "./team-seller-scope";

describe("team-seller-scope", () => {
  describe("resolveManagerTeamUserIds", () => {
    it("returns undefined for non-managers", async () => {
      const result = await resolveManagerTeamUserIds(
        { users: { listDirectReportUserIds: jest.fn() } } as never,
        { canManageOrganization: false, internalUserId: "mgr_1" },
      );
      expect(result).toBeUndefined();
    });

    it("returns undefined when manager has no direct reports", async () => {
      const result = await resolveManagerTeamUserIds(
        {
          users: {
            listDirectReportUserIds: jest.fn().mockResolvedValue([]),
          },
        } as never,
        { canManageOrganization: true, internalUserId: "mgr_1" },
      );
      expect(result).toBeUndefined();
    });

    it("returns manager plus direct reports when team exists", async () => {
      const result = await resolveManagerTeamUserIds(
        {
          users: {
            listDirectReportUserIds: jest
              .fn()
              .mockResolvedValue(["rep_1", "rep_2", "rep_1"]),
          },
        } as never,
        { canManageOrganization: true, internalUserId: "mgr_1" },
      );
      expect(result).toEqual(["mgr_1", "rep_1", "rep_2"]);
    });
  });

  describe("filterRowsByTeamUserIds", () => {
    it("returns all rows when teamUserIds is undefined", () => {
      const rows = [{ sellerUserId: "a" }, { sellerUserId: "b" }];
      expect(filterRowsByTeamUserIds(rows, undefined)).toEqual(rows);
    });

    it("filters by sellerUserId by default", () => {
      const rows = [
        { sellerUserId: "a" },
        { sellerUserId: "b" },
        { sellerUserId: "c" },
      ];
      expect(filterRowsByTeamUserIds(rows, ["a", "c"])).toEqual([
        { sellerUserId: "a" },
        { sellerUserId: "c" },
      ]);
    });

    it("filters by userId when key is userId", () => {
      const rows = [{ userId: "u1" }, { userId: "u2" }];
      expect(filterRowsByTeamUserIds(rows, ["u2"], "userId")).toEqual([
        { userId: "u2" },
      ]);
    });
  });

  it("exports DEFAULT_TRIAL_LIMIT as 5", () => {
    expect(DEFAULT_TRIAL_LIMIT).toBe(5);
  });
});
