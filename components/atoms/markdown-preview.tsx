"use client";

import { useMemo } from "react";
import { renderMarkdownToHtml } from "@/lib/markdown-to-html";
import { cn } from "@/lib/utils";

type MarkdownPreviewProps = {
  markdown: string;
  className?: string;
};

export function MarkdownPreview({ markdown, className }: MarkdownPreviewProps) {
  const html = useMemo(() => renderMarkdownToHtml(markdown), [markdown]);

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none leading-relaxed",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
