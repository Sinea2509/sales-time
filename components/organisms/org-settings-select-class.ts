import { cn } from "@/lib/utils";

export const orgSettingsSelectClassName = cn(
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pl-3 pr-10 text-base outline-none",
  "focus-visible:border-input focus-visible:ring-0",
  "disabled:pointer-events-none disabled:opacity-50 md:text-sm",
  "dark:bg-input/30",
);
