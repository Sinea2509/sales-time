"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardMeetingRowActions({
  meetingId,
  prospectName,
}: {
  meetingId: string;
  prospectName: string;
}) {
  return (
    <Link
      href={`/dashboard/rendez-vous/${meetingId}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
      aria-label={`Actions — ${prospectName}`}
    >
      <MoreVertical className="size-4" />
    </Link>
  );
}
