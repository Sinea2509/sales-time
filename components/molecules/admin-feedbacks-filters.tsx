"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_TYPE_LABELS,
} from "@/lib/feedback-list-filters";
import { parseFeedbackStatusFilter } from "@/lib/feedback-status-filter";

export function AdminFeedbacksFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = parseFeedbackStatusFilter(searchParams.get("status") ?? undefined);
  const type = searchParams.get("type") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const hasScreenshot = searchParams.get("hasScreenshot") ?? "";
  const hasTargetElement = searchParams.get("hasTargetElement") ?? "";

  function pushFilters(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    if (status !== "ALL" && !params.get("status")) {
      params.set("status", status);
    }
    const query = params.toString();
    router.push(query ? `/admin/feedbacks?${query}` : "/admin/feedbacks");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className={nativeSelectClassName}
        value={type}
        onChange={(event) => pushFilters({ type: event.target.value })}
        aria-label="Filtrer par type"
      >
        <option value="">Tous les types</option>
        {Object.entries(FEEDBACK_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className={nativeSelectClassName}
        value={priority}
        onChange={(event) => pushFilters({ priority: event.target.value })}
        aria-label="Filtrer par priorité"
      >
        <option value="">Toutes priorités</option>
        {Object.entries(FEEDBACK_PRIORITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        className={nativeSelectClassName}
        value={hasScreenshot}
        onChange={(event) => pushFilters({ hasScreenshot: event.target.value })}
        aria-label="Filtrer par capture"
      >
        <option value="">Capture: toutes</option>
        <option value="true">Avec capture</option>
        <option value="false">Sans capture</option>
      </select>

      <select
        className={nativeSelectClassName}
        value={hasTargetElement}
        onChange={(event) => pushFilters({ hasTargetElement: event.target.value })}
        aria-label="Filtrer par élément ciblé"
      >
        <option value="">Élément: tous</option>
        <option value="true">Avec élément</option>
        <option value="false">Sans élément</option>
      </select>
    </div>
  );
}
