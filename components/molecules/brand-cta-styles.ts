import { cva } from "class-variance-authority";

export const brandCtaVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary:
          "rounded-md border-0 bg-brand px-4 text-sm text-brand-foreground hover:bg-brand-hover",
        outline:
          "rounded-md border border-brand/25 bg-brand-soft px-4 text-sm text-brand-hover hover:bg-brand/15 dark:text-brand-muted",
      },
      size: {
        sm: "h-10",
        md: "h-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  },
);
