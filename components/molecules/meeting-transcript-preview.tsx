"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const PREVIEW_CHARS = 4_000;

type Props = {
  transcript: string;
};

export function MeetingTranscriptPreview({ transcript }: Props) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = transcript.length > PREVIEW_CHARS;
  const visible =
    expanded || !needsTruncate
      ? transcript
      : `${transcript.slice(0, PREVIEW_CHARS)}…`;

  return (
    <div className="space-y-2">
      <pre className="bg-muted max-h-[320px] overflow-auto rounded-lg p-4 text-xs whitespace-pre-wrap">
        {visible}
      </pre>
      {needsTruncate ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? "Réduire le transcript"
            : `Afficher tout (${transcript.length.toLocaleString("fr-FR")} caractères)`}
        </Button>
      ) : null}
    </div>
  );
}
