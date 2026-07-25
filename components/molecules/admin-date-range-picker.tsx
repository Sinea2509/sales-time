"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7d", label: "7j" },
  { value: "14d", label: "14j" },
  { value: "30d", label: "30j" },
  { value: "60d", label: "60j" },
  { value: "90d", label: "90j" },
] as const;

export function AdminDateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "30d";

  function handleClick(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => handleClick(r.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            current === r.value
              ? "bg-brand text-brand-foreground shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
