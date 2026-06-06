import { describe, expect, it } from "@jest/globals";
import { searchOrgEntities } from "./search-org-entities";

describe("searchOrgEntities", () => {
  it("returns empty results for short queries", async () => {
    const deps = {
      meetings: { searchMeetingsForOrg: jest.fn() },
      contacts: { searchByPrefix: jest.fn() },
      organizationTeam: { listMembersAndPendingInvitations: jest.fn() },
    };

    const result = await searchOrgEntities(deps as never, {
      organizationId: "org_1",
      query: "a",
      canManageOrganization: true,
    });

    expect(result).toEqual({ meetings: [], contacts: [], members: [] });
    expect(deps.meetings.searchMeetingsForOrg).not.toHaveBeenCalled();
  });

  it("scopes meetings to seller when user cannot manage org", async () => {
    const deps = {
      meetings: {
        searchMeetingsForOrg: jest.fn().mockResolvedValue([{ id: "m1" }]),
      },
      contacts: { searchByPrefix: jest.fn().mockResolvedValue([]) },
      organizationTeam: { listMembersAndPendingInvitations: jest.fn() },
    };

    await searchOrgEntities(deps as never, {
      organizationId: "org_1",
      query: "acme",
      sellerUserId: "seller_1",
      canManageOrganization: false,
    });

    expect(deps.meetings.searchMeetingsForOrg).toHaveBeenCalledWith({
      organizationId: "org_1",
      query: "acme",
      sellerUserId: "seller_1",
      limit: 10,
    });
    expect(deps.organizationTeam.listMembersAndPendingInvitations).not.toHaveBeenCalled();
  });

  it("filters team members by query for org admins", async () => {
    const deps = {
      meetings: { searchMeetingsForOrg: jest.fn().mockResolvedValue([]) },
      contacts: { searchByPrefix: jest.fn().mockResolvedValue([]) },
      organizationTeam: {
        listMembersAndPendingInvitations: jest.fn().mockResolvedValue({
          members: [
            {
              userId: "u1",
              email: "alice@example.com",
              firstName: "Alice",
              lastName: "Martin",
            },
            {
              userId: "u2",
              email: "bob@example.com",
              firstName: "Bob",
              lastName: "Durand",
            },
          ],
          pendingInvitations: [],
        }),
      },
    };

    const result = await searchOrgEntities(deps as never, {
      organizationId: "org_1",
      query: "alice",
      canManageOrganization: true,
    });

    expect(result.members).toHaveLength(1);
    expect(result.members[0]?.email).toBe("alice@example.com");
  });
});
