"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type LandingFaqItemProps = {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
};

export function LandingFaqItem({ question, answer, open, onToggle }: LandingFaqItemProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-200 transition-[border-color,box-shadow] hover:border-zinc-300 hover:shadow-[0_2px_14px_rgba(0,0,0,0.06)]",
        open && "border-brand/20",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-between gap-4 bg-white px-5.5 py-4.5 text-left text-[14.5px] font-medium text-zinc-950 transition-colors",
          open && "bg-brand/[0.06]",
        )}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 transition-all",
            open && "rotate-45 border-brand/20 bg-brand/10",
          )}
          aria-hidden
        >
          <Plus className="size-2.75" strokeWidth={2.5} />
        </span>
      </button>
      {open ? (
        <p className="px-5.5 pb-4.5 text-sm leading-[1.78] text-zinc-500">{answer}</p>
      ) : null}
    </div>
  );
}
