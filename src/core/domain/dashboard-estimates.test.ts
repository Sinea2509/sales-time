import { describe, expect, it } from "@jest/globals";
import { tamMinutesSavedPerMeetingFromSettings } from "./dashboard-estimates";

describe("tamMinutesSavedPerMeetingFromSettings", () => {
  it("uses defaults when settings is null", () => {
    expect(tamMinutesSavedPerMeetingFromSettings(null)).toBe(15 + 10 + 8 - 5);
  });

  it("uses org values when provided", () => {
    expect(
      tamMinutesSavedPerMeetingFromSettings({
        tamCrMinutes: 20,
        tamCrmMinutes: 5,
        tamEmailMinutes: 4,
        tamResidualMinutes: 10,
      }),
    ).toBe(Math.max(0, 20 + 5 + 4 - 10));
  });

  it("floors at zero when residual exceeds the sum", () => {
    expect(
      tamMinutesSavedPerMeetingFromSettings({
        tamCrMinutes: 1,
        tamCrmMinutes: 1,
        tamEmailMinutes: 1,
        tamResidualMinutes: 100,
      }),
    ).toBe(0);
  });
});
