import type { MeetingRepositoryPort } from "../ports/meeting-repository-port";

export async function listPersonOutreachPriorities(
  deps: { meetings: MeetingRepositoryPort },
  input: {
    organizationId: string;
    sellerUserId?: string;
    limit?: number;
  },
) {
  return deps.meetings.listPersonOutreachSummaries(input);
}
