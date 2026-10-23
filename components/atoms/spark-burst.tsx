import type { CSSProperties } from "react";

/**
 * Des étincelles qui jaillissent autour d'un élément, régulièrement
 * réparties : celles des médailles et des défis relevés.
 */
export function SparkBurst({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 54 + (i % 3) * 14;
        const style = {
          "--dx": `${Math.round(Math.cos(angle) * dist)}px`,
          "--dy": `${Math.round(Math.sin(angle) * dist)}px`,
          animation: `st-spark 0.9s cubic-bezier(0.22,1,0.36,1) ${0.35 + (i % 4) * 0.05}s both`,
        } as CSSProperties;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-1/2 -mt-1.5 -ml-1.5 size-3"
            style={style}
            aria-hidden
          >
            <path
              d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"
              fill={i % 2 ? "#FFB547" : "#FFFFFF"}
            />
          </svg>
        );
      })}
    </>
  );
}
