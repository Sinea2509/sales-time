const MAX_ENTRIES = 20;

const consoleErrors: string[] = [];
const consoleWarnings: string[] = [];
const unhandledRejections: string[] = [];

let initialized = false;

function pushEntry(buffer: string[], entry: string) {
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
}

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

export function initFeedbackConsoleCapture(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    pushEntry(consoleErrors, formatConsoleArgs(args));
    originalError(...args);
  };

  console.warn = (...args: unknown[]) => {
    pushEntry(consoleWarnings, formatConsoleArgs(args));
    originalWarn(...args);
  };

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : formatConsoleArgs([reason]);
    pushEntry(unhandledRejections, message);
  });
}

export function snapshotFeedbackConsoleErrors(): string[] {
  return [...consoleErrors, ...unhandledRejections];
}

export function snapshotFeedbackConsoleWarnings(): string[] {
  return [...consoleWarnings];
}

export function resetFeedbackConsoleCaptureForTests(): void {
  consoleErrors.length = 0;
  consoleWarnings.length = 0;
  unhandledRejections.length = 0;
  initialized = false;
}
