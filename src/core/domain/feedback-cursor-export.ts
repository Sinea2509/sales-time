import type { FeedbackRow } from "@/src/core/ports/feedback-repository-port";
import { formatFeedbackUserRoleLabel } from "@/src/core/domain/feedback-submit-context";
import {
  parseFeedbackExtra,
  suggestFeedbackSourceFiles,
} from "@/src/core/domain/feedback-target-element";

export function buildFeedbackCursorMarkdown(feedback: FeedbackRow): string {
  const roleLabel = formatFeedbackUserRoleLabel(feedback.extra);
  const extra = parseFeedbackExtra(feedback.extra);
  const target = extra.targetElement ?? null;
  const routePath = extra.technicalContext?.routePath ?? feedback.pageUrl ?? null;

  const userLine = [
    feedback.userEmail ?? "—",
    feedback.companyName ? `(org: ${feedback.companyName})` : null,
    roleLabel ? `(rôle: ${roleLabel})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    `# 🐛 ${feedback.type} report — SalesTime (#${feedback.id.slice(0, 8)})`,
    `**Type:** ${feedback.type.toLowerCase()}`,
    `**Priority:** ${feedback.priority.toLowerCase()}`,
    `**User:** ${userLine}`,
    `**Date:** ${feedback.createdAt.toISOString()}${feedback.appVersion ? `   **App version:** ${feedback.appVersion}` : ""}`,
    "",
    "## Description",
    `« ${feedback.message.replace(/\n/g, " ")} »`,
    "",
    "## Contexte technique",
    `- URL: ${feedback.pageUrl ?? "—"}`,
    `- Route: ${routePath ?? "—"}`,
    `- Navigateur: ${feedback.browser ?? "—"} — ${feedback.os ?? "—"}`,
    `- Device: ${feedback.deviceType ?? "—"} — viewport ${feedback.viewport ?? "—"} (écran ${feedback.screenSize ?? "—"}) — locale ${feedback.locale ?? "—"}`,
    `- Scroll: ${extra.technicalContext?.scrollPosition ?? "—"}`,
    "",
  ];

  if (target) {
    const targetLines = [
      "## Élément ciblé",
      `- Selector: \`${target.cssSelector}\``,
      `- XPath: \`${target.xpath}\``,
      target.dataFeedbackId
        ? `- data-feedback-id: \`${target.dataFeedbackId}\``
        : "- data-feedback-id: (aucun)",
      `- Tag: ${target.tagName}`,
      target.textSnippet ? `- Texte: "${target.textSnippet}"` : "- Texte: (vide)",
      `- Rect: ${Math.round(target.boundingRect.x)},${Math.round(target.boundingRect.y)} ${Math.round(target.boundingRect.width)}×${Math.round(target.boundingRect.height)} @ scroll ${target.scroll.x},${target.scroll.y}`,
      "",
    ];
    if (target.ariaLabel) {
      targetLines.splice(6, 0, `- Aria-label: "${target.ariaLabel}"`);
    }
    lines.push(...targetLines);
  }

  const sourceFiles = suggestFeedbackSourceFiles(target, routePath);
  if (sourceFiles.length > 0) {
    lines.push("## Piste de code (grep)", "");
    if (target?.dataFeedbackId) {
      lines.push(`- \`data-feedback-id="${target.dataFeedbackId}"\``);
    }
    for (const file of sourceFiles) {
      lines.push(`- \`${file}\``);
    }
    lines.push("");
  }

  lines.push("## Erreurs console");
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

  const warnings = extra.consoleWarnings ?? [];
  lines.push("", "## Avertissements console");
  if (warnings.length === 0) {
    lines.push("- (aucun)");
  } else {
    for (const warn of warnings.slice(0, 10)) {
      lines.push(`- ${warn}`);
    }
  }

  const networkErrors = extra.networkErrors ?? [];
  lines.push("", "## Erreurs réseau");
  if (networkErrors.length === 0) {
    lines.push("- (aucune)");
  } else {
    for (const entry of networkErrors.slice(0, 10)) {
      lines.push(`- ${entry}`);
    }
  }

  lines.push("", "## Screenshot", feedback.screenshotUrl ?? "(aucune)");
  if (extra.elementCropUrl) {
    lines.push("", "## Crop élément", extra.elementCropUrl);
  }

  lines.push("", "## Contexte applicatif", JSON.stringify(extra.submitContext ?? {}, null, 2));

  return lines.join("\n");
}
