import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingSiteHeader() {
  return (
    <header className="border-border/80 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-foreground group flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold transition-transform group-hover:scale-105">
            S
          </span>
          <span className="hidden sm:inline">Sales Time</span>
        </Link>

        <nav
          className="flex items-center gap-2 sm:gap-3"
          aria-label="Primary"
        >
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "sm:hidden",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/company"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden md:inline-flex",
            )}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
