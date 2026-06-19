import { UAParser } from "ua-parser-js";
import { z } from "zod";
import type { FeedbackType } from "@/src/core/ports/feedback-repository-port";
import type { FeedbackPriority } from "@/src/core/ports/feedback-repository-port";
import { defaultFeedbackPriorityForType } from "@/src/core/domain/feedback-target-element";

export const feedbackPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export type ParsedUserAgent = {
  browser: string | null;
  os: string | null;
  deviceType: string | null;
};

export function parseFeedbackUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  if (!userAgent?.trim()) {
    return { browser: null, os: null, deviceType: null };
  }

  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const osInfo = parser.getOS();
  const device = parser.getDevice();

  const browserLabel = [browser.name, browser.version?.split(".")[0]]
    .filter(Boolean)
    .join(" ");
  const osLabel = [osInfo.name, osInfo.version].filter(Boolean).join(" ");
  const deviceType = device.type ?? "desktop";

  return {
    browser: browserLabel || null,
    os: osLabel || null,
    deviceType,
  };
}

export function resolveFeedbackPriority(input: {
  type: FeedbackType;
  priority?: FeedbackPriority | null;
}): FeedbackPriority {
  if (input.priority) return input.priority;
  return defaultFeedbackPriorityForType(input.type);
}

export function buildClientTechnicalContextSnapshot(): {
  routePath: string | null;
  referrer: string | null;
  timezone: string | null;
  scrollPosition: string | null;
} {
  if (typeof window === "undefined") {
    return {
      routePath: null,
      referrer: null,
      timezone: null,
      scrollPosition: null,
    };
  }

  return {
    routePath: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
    scrollPosition: `${window.scrollX},${window.scrollY}`,
  };
}

export function sanitizeNetworkErrorUrl(
  rawUrl: string,
  origin = "http://localhost",
): string {
  try {
    const url = new URL(rawUrl, origin);
    return `${url.pathname}`;
  } catch {
    const withoutQuery = rawUrl.split("?")[0] ?? rawUrl;
    return withoutQuery.slice(0, 200);
  }
}

export function formatNetworkErrorEntry(input: {
  method: string;
  url: string;
  status?: number | null;
  origin?: string;
}): string {
  const path = sanitizeNetworkErrorUrl(input.url, input.origin);
  if (input.status != null) {
    return `${input.method.toUpperCase()} ${path} → ${input.status}`;
  }
  return `${input.method.toUpperCase()} ${path} → network error`;
}
