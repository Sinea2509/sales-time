import { cn } from "@/lib/utils";

/**
 * Hides the native OS dropdown arrow and draws a chevron aligned with
 * `components/ui/select` (muted foreground, rounded stroke caps).
 */
export const nativeSelectChevronClasses = cn(
  "cursor-pointer appearance-none bg-no-repeat",
  "bg-[length:1.125rem_1.125rem] bg-[position:right_0.6rem_center]",
  'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]',
  'dark:bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%222.25%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]',
);

const nativeSelectFieldBase = cn(
  "w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pl-3 outline-none",
  "focus-visible:border-input focus-visible:ring-0",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  nativeSelectChevronClasses,
);

/** Default native `<select>` (e.g. settings, onboarding). */
export const nativeSelectClassName = cn(
  nativeSelectFieldBase,
  "h-9 pr-10 text-base md:text-sm",
  "dark:bg-input/30",
);

/** Compact native `<select>` (e.g. table row role). */
export const nativeSelectCompactClassName = cn(
  nativeSelectFieldBase,
  "h-8 pr-9 text-xs md:text-xs",
  "dark:bg-input/30",
  "bg-[length:1rem_1rem] bg-[position:right_0.45rem_center]",
);
