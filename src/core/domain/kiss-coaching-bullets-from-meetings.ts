import { kissResultSchema } from "./kiss-result-zod";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import type { KissQuadrantKey } from "./kiss-org-coaching-prompts";

export function kissCoachingBulletsFromMeetings(
  meetings: RecentMeetingListRow[],
  field: KissQuadrantKey,
  limit = 5,
): string[] {
  const seen = new Set<string>();
  const bullets: string[] = [];

  for (const meeting of meetings) {
    const parsed = kissResultSchema.safeParse(meeting.latestKissResult);
    if (!parsed.success) continue;
    for (const raw of parsed.data[field]) {
      const text = raw.trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      bullets.push(text);
      if (bullets.length >= limit) return bullets;
    }
  }

  return bullets;
}
