"use client";

import { useEffect } from "react";
import { initFeedbackConsoleCapture } from "@/lib/feedback-console-capture";
import { initFeedbackNetworkCapture } from "@/lib/feedback-network-capture";

export function FeedbackCaptureProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initFeedbackConsoleCapture();
    initFeedbackNetworkCapture();
  }, []);

  return children;
}
