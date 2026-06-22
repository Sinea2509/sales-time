export const MEETING_MUTATION_EVENT = "sales-time:meeting-mutated";

export type MeetingMutationDetail = {
  sellerUserId: string;
};

export function dispatchMeetingMutation(detail: MeetingMutationDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MeetingMutationDetail>(MEETING_MUTATION_EVENT, { detail }),
  );
}
