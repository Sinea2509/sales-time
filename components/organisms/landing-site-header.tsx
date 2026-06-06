"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { landingNavLinks } from "@/lib/landing-content";
import { cn } from "@/lib/utils";

export function LandingSiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] flex h-[60px] items-center border-b border-white/6 backdrop-blur-[20px] transition-colors",
        scrolled ? "bg-[#06060A]/88" : "bg-[#06060A]/70",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1160px] items-center gap-0 px-6 sm:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.25">
          <SalesTimeLogoMark />
          <span className="text-[15px] font-bold tracking-tight text-white">Sales Time</span>
        </Link>

        <nav
          className="ml-8 hidden flex-1 items-center gap-0.5 md:flex"
          aria-label="Sur cette page"
        >
          {landingNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-[7px] px-3 py-1.25 text-[13.5px] whitespace-nowrap text-white/50 transition-colors hover:bg-white/6 hover:text-white/85"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <nav
          className="ml-auto flex shrink-0 items-center gap-2"
          aria-label="Navigation principale"
        >
          <Link
            href="/sign-in"
            className="rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium whitespace-nowrap text-white/55 transition-colors hover:text-white"
          >
            Connexion
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand px-4 py-1.75 text-[13.5px] font-semibold whitespace-nowrap text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_1px_3px_rgba(108,77,255,0.35)] transition-[filter] hover:brightness-110"
          >
            Commencer
          </Link>
        </nav>
      </div>
    </header>
  );
}
