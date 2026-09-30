import type { WeeklyManagerDigest } from "@/src/core/domain/weekly-manager-digest";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return "0";
}

function meetingList(
  title: string,
  lines: WeeklyManagerDigest["bestMeetings"],
  baseUrl: string,
): string {
  if (lines.length === 0) return "";
  const items = lines
    .map((m) => {
      const who = m.prospectCompany
        ? `${escapeHtml(m.prospectName)} (${escapeHtml(m.prospectCompany)})`
        : escapeHtml(m.prospectName);
      return `<li style="margin:0 0 6px 0;"><a href="${baseUrl}/company/rendez-vous/${m.id}" style="color:#6c4dff;text-decoration:none;">${who}</a> · ${escapeHtml(m.sellerName)} · <strong>${m.salesScore}</strong>/100</li>`;
    })
    .join("");
  return `<h3 style="margin:24px 0 8px 0;font-size:15px;">${title}</h3><ul style="margin:0;padding-left:18px;">${items}</ul>`;
}

/**
 * Le bilan de la semaine, en HTML simple lisible dans tous les clients mail.
 * La première ligne suffit à qui ne descend pas plus bas.
 */
export function weeklyDigestHtml(input: {
  organizationName: string;
  digest: WeeklyManagerDigest;
  baseUrl: string;
  weekLabel: string;
}): { subject: string; html: string } {
  const { digest, baseUrl } = input;
  const scoreLine =
    digest.averageSalesScore != null
      ? `SalesScore moyen <strong>${digest.averageSalesScore}</strong>/100` +
        (digest.salesScoreDelta != null
          ? ` (${signed(digest.salesScoreDelta)} ${Math.abs(digest.salesScoreDelta) > 1 ? "points" : "point"} sur la semaine précédente)`
          : "")
      : "Aucun rendez-vous noté cette semaine";

  const headline = `${digest.meetingsCount} rendez-vous cette semaine, ${digest.analyzedCount} analysé${digest.analyzedCount > 1 ? "s" : ""}`;

  const silent =
    digest.silentSellers.length > 0
      ? `<h3 style="margin:24px 0 8px 0;font-size:15px;">Sans rendez-vous cette semaine</h3><p style="margin:0;">${digest.silentSellers.map(escapeHtml).join(", ")}</p>`
      : "";

  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#f6f5fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1b22;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e4f0;border-radius:12px;padding:28px;">
<p style="margin:0 0 4px 0;font-size:12px;color:#6b6980;text-transform:uppercase;letter-spacing:.04em;">Sales Time · ${escapeHtml(input.organizationName)} · ${escapeHtml(input.weekLabel)}</p>
<h1 style="margin:0 0 12px 0;font-size:20px;">${headline}</h1>
<p style="margin:0 0 4px 0;font-size:15px;">${scoreLine}</p>
<p style="margin:0;font-size:13px;color:#6b6980;">Semaine précédente : ${digest.previousMeetingsCount} rendez-vous${digest.previousAverageSalesScore != null ? `, SalesScore moyen ${digest.previousAverageSalesScore}/100` : ""}.</p>
${meetingList("Les meilleurs rendez-vous", digest.bestMeetings, baseUrl)}
${meetingList("À relire avec le commercial", digest.meetingsToReview, baseUrl)}
${silent}
<p style="margin:28px 0 0 0;"><a href="${baseUrl}/company" style="display:inline-block;background:#6c4dff;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">Ouvrir le tableau de bord</a></p>
<p style="margin:20px 0 0 0;font-size:12px;color:#6b6980;">Vous recevez ce bilan parce que vous êtes manager de cette organisation dans Sales Time.</p>
</div></body></html>`;

  return {
    subject: `Sales Time · Bilan de la semaine : ${headline}`,
    html,
  };
}
