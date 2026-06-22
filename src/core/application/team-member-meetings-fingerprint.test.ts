import { teamMemberMeetingsFingerprint } from "./team-member-meetings-fingerprint";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

function row(
  partial: Pick<RecentMeetingListRow, "id" | "status" | "updatedAt">,
): RecentMeetingListRow {
  return {
    id: partial.id,
    status: partial.status,
    updatedAt: partial.updatedAt,
  } as RecentMeetingListRow;
}

describe("teamMemberMeetingsFingerprint", () => {
  it("changes when a meeting is added", () => {
    const base = [
      row({ id: "a", status: "READY", updatedAt: new Date("2026-01-01") }),
    ];
    const withNew = [
      ...base,
      row({ id: "b", status: "PROCESSING", updatedAt: new Date("2026-01-02") }),
    ];
    expect(teamMemberMeetingsFingerprint(base)).not.toBe(
      teamMemberMeetingsFingerprint(withNew),
    );
  });

  it("changes when analysis status updates", () => {
    const processing = [
      row({ id: "a", status: "PROCESSING", updatedAt: new Date("2026-01-01") }),
    ];
    const ready = [
      row({ id: "a", status: "READY", updatedAt: new Date("2026-01-02") }),
    ];
    expect(teamMemberMeetingsFingerprint(processing)).not.toBe(
      teamMemberMeetingsFingerprint(ready),
    );
  });
});
