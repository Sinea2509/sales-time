/**
 * Starts analysis immediately after a job is enqueued. Uses a separate worker
 * request so the create/update action returns quickly while AI runs (up to 300s).
 */
export function wakeAnalysisWorker(): void {
  const baseUrl = resolveWorkerBaseUrl();
  if (!baseUrl) return;

  const secret = process.env.CRON_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secret) {
    console.error(
      "wakeAnalysisWorker: CRON_SECRET is missing — analysis will not start",
    );
    return;
  }

  const headers: Record<string, string> = {};
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const url = new URL("/api/worker/process-jobs", baseUrl);
  void fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(290_000),
  }).catch((cause) => {
    console.error("wakeAnalysisWorker: fetch failed", cause);
  });
}

function resolveWorkerBaseUrl(): string | null {
  const appBase = process.env.APP_BASE_URL?.trim();
  if (appBase) return appBase.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;

  if (process.env.NODE_ENV !== "production") {
    const port = process.env.PORT?.trim() || "3000";
    return `http://localhost:${port}`;
  }

  return null;
}
