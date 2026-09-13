"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function KpiTileHintShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="block w-full cursor-help rounded-2xl text-left"
        aria-label={`${label}, afficher l'explication`}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-sm text-left leading-relaxed"
      >
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}
