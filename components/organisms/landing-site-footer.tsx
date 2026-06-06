import Link from "next/link";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";

export function LandingSiteFooter() {
  return (
    <footer className="border-t border-white/6 bg-[#06060A] py-8">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SalesTimeLogoMark size="sm" />
            <span className="text-sm font-bold text-white/60">Sales Time</span>
          </div>
          <nav className="flex flex-wrap gap-5" aria-label="Pied de page">
            <Link
              href="/sign-in"
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
            >
              Inscription
            </Link>
            <Link
              href="/company/plan"
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
            >
              Plan produit
            </Link>
            <a
              href="#faq"
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
            >
              FAQ
            </a>
          </nav>
          <p className="text-xs text-white/18">
            © {new Date().getFullYear()} Sales Time. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
