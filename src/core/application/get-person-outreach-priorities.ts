import type { MeetingRepositoryPort } from "../ports/meeting-repository-port";

export async function listPersonOutreachPriorities(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    clerkOrgId: string;
    sellerUserId?: string;
    limit?: number;
  },
) {
  return deps.meetings.listPersonOutreachSummaries(input);
}
