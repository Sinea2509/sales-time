import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { brandCtaVariants } from "@/components/molecules/brand-cta-styles";
import { cn } from "@/lib/utils";

export type BrandCtaButtonProps = ComponentProps<"button"> &
  VariantProps<typeof brandCtaVariants>;

export function BrandCtaButton({
  className,
  variant,
  size,
  type = "button",
  ...props
}: BrandCtaButtonProps) {
  return (
    <button
      type={type}
      className={cn(brandCtaVariants({ variant, size }), className)}
      {...props}
    />
  );
}
