export type StatAccent = "blue" | "emerald" | "violet" | "amber";

export const statAccentStyles: Record<
  StatAccent,
  { bg: string; icon: string }
> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    icon: "text-blue-600 dark:text-blue-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    icon: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    icon: "text-amber-600 dark:text-amber-400",
  },
};
