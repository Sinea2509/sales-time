import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const anchorClass =
  "text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors md:inline";

export function LandingSiteHeader() {
  return (
    <header className="border-border/80 bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-foreground group flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="bg-brand text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold shadow-sm transition-transform group-hover:scale-[1.03]">
            S
          </span>
          <span className="hidden sm:inline">Sales Time</span>
        </Link>

        <nav
          className="text-muted-foreground hidden items-center gap-6 md:flex"
          aria-label="Sur cette page"
        >
          <a href="#references" className={anchorClass}>
            Références
          </a>
          <a href="#temoignages" className={anchorClass}>
            Témoignages
          </a>
          <a href="#fonctionnalites" className={anchorClass}>
            Fonctionnalités
          </a>
          <a href="#faq" className={anchorClass}>
            FAQ
          </a>
          <Link
            href="/company/plan"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Tarifs
          </Link>
        </nav>

        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Navigation principale"
        >
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
