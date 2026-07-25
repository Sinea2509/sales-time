"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const brandButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-brand text-brand-foreground hover:bg-brand-hover active:translate-y-px",
        outline:
          "border-brand/25 bg-brand-soft text-brand-hover hover:bg-brand/15 dark:text-brand-muted",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  },
);

export type BrandButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof brandButtonVariants>;

export function BrandButton({
  className,
  variant,
  size,
  ...props
}: BrandButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="brand-button"
      className={cn(brandButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
