import Link from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { brandCtaVariants } from "@/components/molecules/brand-cta-styles";
import { cn } from "@/lib/utils";

export type BrandCtaLinkProps = Omit<ComponentProps<typeof Link>, "className"> &
  VariantProps<typeof brandCtaVariants> & { className?: string };

export function BrandCtaLink({
  className,
  variant,
  size,
  ...props
}: BrandCtaLinkProps) {
  return (
    <Link
      className={cn(brandCtaVariants({ variant, size }), className)}
      {...props}
    />
  );
}
