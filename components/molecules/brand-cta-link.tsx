import Link from "next/link";
import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const brandCtaLinkVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary: "rounded-lg border-0 bg-brand px-4 text-sm text-white hover:bg-brand-hover",
        outline:
          "rounded-lg border border-brand/25 bg-brand-soft px-4 text-sm text-brand-hover hover:bg-brand/15 dark:text-brand-muted",
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

export type BrandCtaLinkProps = Omit<ComponentProps<typeof Link>, "className"> &
  VariantProps<typeof brandCtaLinkVariants> & { className?: string };

export function BrandCtaLink({
  className,
  variant,
  size,
  ...props
}: BrandCtaLinkProps) {
  return (
    <Link
      className={cn(brandCtaLinkVariants({ variant, size }), className)}
      {...props}
    />
  );
}
