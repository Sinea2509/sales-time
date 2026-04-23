/**
 * App-owned meeting outcome (mirrors Prisma `MeetingOutcome`; defined here so core does not depend on generated Prisma enums).
 */
export const MEETING_OUTCOMES = [
  "WON",
  "LOST",
  "FOLLOW_UP",
  "NO_SHOW",
  "OTHER",
] as const;

export type MeetingOutcome = (typeof MEETING_OUTCOMES)[number];

export function isMeetingOutcome(value: string): value is MeetingOutcome {
  return (MEETING_OUTCOMES as readonly string[]).includes(value);
}
