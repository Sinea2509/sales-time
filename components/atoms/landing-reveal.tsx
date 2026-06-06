"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LandingRevealProps = {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
};

const delayClasses = {
  0: "",
  1: "delay-[80ms]",
  2: "delay-[160ms]",
  3: "delay-[240ms]",
  4: "delay-[320ms]",
} as const;

export function LandingReveal({ children, delay = 0, className }: LandingRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "translate-y-6 opacity-0 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible && "translate-y-0 opacity-100",
        delayClasses[delay],
        className,
      )}
    >
      {children}
    </div>
  );
}
