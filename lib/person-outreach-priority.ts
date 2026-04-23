/**
 * Higher score = more worth prioritizing for follow-up (idle time + volume).
 */
export function outreachPriorityScore(input: {
  lastMeetingAt: Date;
  meetingCount: number;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const daysIdle = Math.max(
    0,
    (now.getTime() - input.lastMeetingAt.getTime()) / 86_400_000,
  );
  return Math.min(
    100,
    Math.round(daysIdle * 2.5 + Math.log(input.meetingCount + 1) * 18),
  );
}
