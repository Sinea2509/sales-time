/** Nom affiché du commercial assigné à un rendez-vous. */
export function sellerDisplayNameFromMeetingRow(meeting: {
  sellerFirstName: string | null;
  sellerLastName: string | null;
  sellerEmail: string | null;
}): string {
  const name = [
    meeting.sellerFirstName?.trim() ?? "",
    meeting.sellerLastName?.trim() ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || meeting.sellerEmail?.trim() || "Commercial";
}
