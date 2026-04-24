import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingSiteHeader() {
  return (
    <header className="border-border/80 bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-foreground group flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="bg-brand text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-transform group-hover:scale-[1.03]">
            S
          </span>
          <span className="hidden sm:inline">Sales Time</span>
        </Link>

        <nav
          className="flex items-center gap-2 sm:gap-3"
          aria-label="Navigation principale"
        >
          <Link
            href="/plan"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden text-muted-foreground hover:text-foreground sm:inline-flex",
            )}
          >
            Démo
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Connexion
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "sm" }),
              "border-0 bg-brand text-white shadow-sm hover:bg-brand-hover",
            )}
          >
            Commencer
          </Link>
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "sm:hidden",
            )}
          >
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}
