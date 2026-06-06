import { describe, expect, it } from "@jest/globals";
import {
  isMeetingStatus,
  MEETING_STATUSES,
  MEETING_SOURCE_TYPES,
} from "./meeting-status";

describe("meeting-status", () => {
  it("isMeetingStatus accepts known statuses", () => {
    for (const status of MEETING_STATUSES) {
      expect(isMeetingStatus(status)).toBe(true);
    }
    expect(isMeetingStatus("UNKNOWN")).toBe(false);
  });

  it("exports source types UPLOAD and TRANSCRIPT", () => {
    expect(MEETING_SOURCE_TYPES).toEqual(["UPLOAD", "TRANSCRIPT"]);
  });
});
