"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  dataUrl: string | null;
  loading?: boolean;
  onRecapture: () => void;
};

export function FeedbackScreenshotPreview({ dataUrl, loading, onRecapture }: Props) {
  if (loading) {
    return (
      <div className="bg-muted/40 flex h-36 items-center justify-center rounded-lg border text-sm">
        Capture en cours…
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className="space-y-2">
        <div className="bg-muted/40 flex h-36 items-center justify-center rounded-lg border text-sm text-muted-foreground">
          Capture indisponible
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onRecapture}>
          <RefreshCw className="mr-1 size-3.5" />
          Recapturer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt="Aperçu capture"
        className="max-h-48 w-full rounded-lg border object-contain"
      />
      <Button type="button" size="sm" variant="outline" onClick={onRecapture}>
        <RefreshCw className="mr-1 size-3.5" />
        Recapturer
      </Button>
    </div>
  );
}
