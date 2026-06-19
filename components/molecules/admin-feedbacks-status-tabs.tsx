"use client";

import { useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FEEDBACK_STATUS_TABS,
  type FeedbackStatusFilter,
} from "@/lib/feedback-status-filter";
import type { FeedbackStatus } from "@/src/core/ports/feedback-repository-port";

export type FeedbackStatusCounts = Record<FeedbackStatus, number> & {
  all: number;
};

export function AdminFeedbacksStatusTabs({
  activeStatus,
  counts,
}: {
  activeStatus: FeedbackStatusFilter;
  counts: FeedbackStatusCounts;
}) {
  const router = useRouter();

  return (
    <Tabs
      value={activeStatus}
      onValueChange={(value) => {
        const next = value as FeedbackStatusFilter;
        router.push(
          next === "ALL" ? "/admin/feedbacks" : `/admin/feedbacks?status=${next}`,
        );
      }}
    >
      <TabsList>
        {FEEDBACK_STATUS_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            <span className="text-muted-foreground tabular-nums">
              ({counts[tab.value === "ALL" ? "all" : tab.value]})
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
