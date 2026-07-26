import { cn } from "@/lib/utils";

const coachSecondaryGreyClass =
  "border border-neutral-200 bg-[#F5F5F5] text-foreground shadow-none hover:bg-[#EBEBEB] dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700";

/** CTA « + Ajouter … » : même style en onboarding et dans les paramètres Coach IA. */
export const coachListAddSecondaryButtonClass = cn(
  "inline-flex w-full items-center justify-center sm:w-auto",
  "my-3 px-5 py-4 text-sm font-medium",
  coachSecondaryGreyClass,
);
