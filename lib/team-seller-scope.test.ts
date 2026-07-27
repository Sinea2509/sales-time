import { describe, expect, it } from "@jest/globals";
import {
  DEFAULT_TRIAL_LIMIT,
  resolveManagerTeamUserIds,
  resolveSellerTeamUserIds,
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

  describe("resolveSellerTeamUserIds", () => {
    it("returns undefined when the seller has no internal user id", async () => {
      const result = await resolveSellerTeamUserIds(
        {
          users: {
            findManagerUserId: jest.fn(),
            listDirectReportUserIds: jest.fn(),
          },
        } as never,
        { internalUserId: null },
      );
      expect(result).toBeUndefined();
    });

    it("returns undefined when the seller has no manager", async () => {
      const result = await resolveSellerTeamUserIds(
        {
          users: {
            findManagerUserId: jest.fn().mockResolvedValue(null),
            listDirectReportUserIds: jest.fn(),
          },
        } as never,
        { internalUserId: "rep_1" },
      );
      expect(result).toBeUndefined();
    });

    // Le point de toute la fonction : un commercial doit être classé sur
    // exactement le groupe que son manager voit, sans quoi les deux écrans
    // annoncent deux places différentes pour la même personne.
    it("returns the same team its manager would see", async () => {
      const deps = {
        users: {
          findManagerUserId: jest.fn().mockResolvedValue("mgr_1"),
          listDirectReportUserIds: jest
            .fn()
            .mockResolvedValue(["rep_1", "rep_2"]),
        },
      } as never;
      const vuCommercial = await resolveSellerTeamUserIds(deps, {
        internalUserId: "rep_1",
      });
      const vuManager = await resolveManagerTeamUserIds(deps, {
        canManageOrganization: true,
        internalUserId: "mgr_1",
      });
      expect(vuCommercial).toEqual(["mgr_1", "rep_1", "rep_2"]);
      expect(new Set(vuCommercial)).toEqual(new Set(vuManager));
    });

    it("keeps the seller in the team even if the report list is stale", async () => {
      const result = await resolveSellerTeamUserIds(
        {
          users: {
            findManagerUserId: jest.fn().mockResolvedValue("mgr_1"),
            listDirectReportUserIds: jest.fn().mockResolvedValue(["rep_2"]),
          },
        } as never,
        { internalUserId: "rep_1" },
      );
      expect(result).toEqual(["mgr_1", "rep_2", "rep_1"]);
    });
  });

  it("exports DEFAULT_TRIAL_LIMIT as 5", () => {
    expect(DEFAULT_TRIAL_LIMIT).toBe(5);
  });
});
