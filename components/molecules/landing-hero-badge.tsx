type LandingHeroBadgeProps = {
  children: React.ReactNode;
};

export function LandingHeroBadge({ children }: LandingHeroBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/28 bg-brand/12 px-3.5 py-1.5 pl-2 text-xs font-medium text-brand-muted">
      <span
        className="size-1.5 rounded-full bg-brand shadow-[0_0_6px_rgba(108,77,255,0.8)]"
        aria-hidden
      />
      {children}
    </span>
  );
}
