import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  className?: string;
};

export function NavLinkButton({
  variant = "default",
  size = "default",
  className,
  ...props
}: NavLinkButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
