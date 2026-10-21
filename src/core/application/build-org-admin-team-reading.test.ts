import { describe, expect, it } from "@jest/globals";
import { buildOrgAdminTeamReading } from "./get-org-admin-dashboard";

type Row = Parameters<typeof buildOrgAdminTeamReading>[0]["rows"][number];

function row(partial: Partial<Row>): Row {
  return {
    userId: "u",
    firstName: null,
    lastName: null,
    email: "u@exemple.fr",
    salesScoreAvg: null,
    scoredMeetings: 0,
    noteGlobaleOn5: null,
    rank: null,
    tier: null,
    unrankedReason: null,
    ...partial,
  } as Row;
}

describe("buildOrgAdminTeamReading, podium", () => {
  it("liste à part les membres notés mais pas encore classés", () => {
    const reading = buildOrgAdminTeamReading({
      rows: [
        row({
          userId: "u-classe",
          firstName: "Thomas",
          salesScoreAvg: 70,
          scoredMeetings: 5,
          noteGlobaleOn5: 3.5,
          rank: 1,
        }),
        row({
          userId: "u-attente",
          firstName: "Zohra",
          salesScoreAvg: 80,
          scoredMeetings: 1,
          noteGlobaleOn5: 4,
          unrankedReason: "volume-insuffisant",
        }),
        row({ userId: "u-sans-note", unrankedReason: "sans-note" }),
      ],
      meetings: [],
    });
    expect(reading.podium.map((p) => p.userId)).toEqual(["u-classe"]);
    expect(reading.podiumWaiting).toEqual([
      expect.objectContaining({ userId: "u-attente", scoredMeetings: 1 }),
    ]);
    expect(reading.minScoredMeetings).toBe(3);
  });
});
