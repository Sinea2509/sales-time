import type { FeedbackRow } from "@/src/core/ports/feedback-repository-port";

export function buildFeedbackCursorMarkdown(feedback: FeedbackRow): string {
  const lines = [
    `# 🐛 ${feedback.type} report — SalesTime (#${feedback.id.slice(0, 8)})`,
    `**Type:** ${feedback.type.toLowerCase()}`,
    `**User:** ${feedback.userEmail ?? "—"}${feedback.companyName ? ` (org: ${feedback.companyName})` : ""}`,
    `**Date:** ${feedback.createdAt.toISOString()}${feedback.appVersion ? `   **App version:** ${feedback.appVersion}` : ""}`,
    "",
    "## Description",
    `« ${feedback.message.replace(/\n/g, " ")} »`,
    "",
    "## Contexte technique",
    `- URL: ${feedback.pageUrl ?? "—"}`,
    `- Navigateur: ${feedback.browser ?? "—"} — ${feedback.os ?? "—"}`,
    `- Device: ${feedback.deviceType ?? "—"} — viewport ${feedback.viewport ?? "—"} (écran ${feedback.screenSize ?? "—"}) — locale ${feedback.locale ?? "—"}`,
    "",
    "## Erreurs console",
  ];

  const errors = Array.isArray(feedback.consoleErrors)
    ? (feedback.consoleErrors as string[])
    : [];
  if (errors.length === 0) {
    lines.push("- (aucune)");
  } else {
    for (const err of errors.slice(0, 10)) {
      lines.push(`- ${err}`);
    }
  }

  lines.push("", "## Screenshot", feedback.screenshotUrl ?? "(aucune)", "");
  lines.push(
    "## Contexte applicatif",
    JSON.stringify(feedback.extra ?? {}, null, 2),
  );

  return lines.join("\n");
}
