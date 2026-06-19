import html2canvas from "html2canvas";
import type { FeedbackTargetElement } from "@/src/core/domain/feedback-target-element";

const HIGHLIGHT_COLOR = "rgba(59, 130, 246, 0.35)";
const HIGHLIGHT_BORDER = "rgb(59, 130, 246)";

export async function captureFeedbackScreenshot(input: {
  targetElement?: FeedbackTargetElement | null;
}): Promise<{ blob: Blob | null; dataUrl: string | null }> {
  try {
    const canvas = await html2canvas(document.body, {
      scale: 0.75,
      logging: false,
      useCORS: true,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
    });

    if (input.targetElement) {
      drawTargetHighlight(canvas, input.targetElement);
    }

    const blob = await canvasToBlob(canvas);
    const dataUrl = canvas.toDataURL("image/png", 0.85);
    return { blob, dataUrl };
  } catch {
    return { blob: null, dataUrl: null };
  }
}

export async function captureElementCropBlob(
  target: FeedbackTargetElement,
  padding = 40,
): Promise<Blob | null> {
  try {
    const canvas = await html2canvas(document.body, {
      scale: 0.75,
      logging: false,
      useCORS: true,
    });

    const scale = canvas.width / document.documentElement.clientWidth;
    const rect = target.boundingRect;
    const x = Math.max(0, (rect.x + target.scroll.x) * scale - padding * scale);
    const y = Math.max(0, (rect.y + target.scroll.y) * scale - padding * scale);
    const width = Math.min(
      canvas.width - x,
      (rect.width + padding * 2) * scale,
    );
    const height = Math.min(
      canvas.height - y,
      (rect.height + padding * 2) * scale,
    );

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = width;
    cropCanvas.height = height;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    return canvasToBlob(cropCanvas);
  } catch {
    return null;
  }
}

function drawTargetHighlight(
  canvas: HTMLCanvasElement,
  target: FeedbackTargetElement,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const scale = canvas.width / document.documentElement.clientWidth;
  const rect = target.boundingRect;
  const x = (rect.x + target.scroll.x) * scale;
  const y = (rect.y + target.scroll.y) * scale;
  const width = rect.width * scale;
  const height = rect.height * scale;

  ctx.fillStyle = HIGHLIGHT_COLOR;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = HIGHLIGHT_BORDER;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.85));
}

export async function uploadFeedbackScreenshotBlob(
  blob: Blob,
  suffix = "feedback",
): Promise<string | null> {
  const fd = new FormData();
  fd.set("file", blob, `${suffix}.png`);
  const res = await fetch("/api/feedback/screenshot", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { url?: string };
  return json.url ?? null;
}
