/** Lightweight markdown → HTML for admin prompt preview (no external dependency). */
export function renderMarkdownToHtml(md: string): string {
  let html = "";
  const lines = md.split("\n");
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inList: "ul" | "ol" | null = null;

  const flushList = () => {
    if (inList) {
      html += inList === "ul" ? "</ul>" : "</ol>";
      inList = null;
    }
  };

  const inlineFormat = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>',
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto my-2"><code>${codeBuffer.join("\n")}</code></pre>`;
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(
        line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      );
      continue;
    }

    if (line.trim() === "") {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const sizes = [
        "text-xl font-bold",
        "text-lg font-semibold",
        "text-base font-semibold",
        "text-sm font-semibold",
      ];
      html += `<h${level} class="${sizes[level - 1]} mt-3 mb-1">${inlineFormat(headingMatch[2])}</h${level}>`;
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (inList !== "ul") {
        flushList();
        html += '<ul class="list-disc pl-5 space-y-0.5">';
        inList = "ul";
      }
      html += `<li>${inlineFormat(ulMatch[1])}</li>`;
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (inList !== "ol") {
        flushList();
        html += '<ol class="list-decimal pl-5 space-y-0.5">';
        inList = "ol";
      }
      html += `<li>${inlineFormat(olMatch[1])}</li>`;
      continue;
    }

    flushList();
    html += `<p class="my-1">${inlineFormat(line)}</p>`;
  }

  flushList();
  if (inCodeBlock && codeBuffer.length > 0) {
    html += `<pre class="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto my-2"><code>${codeBuffer.join("\n")}</code></pre>`;
  }

  return html;
}
