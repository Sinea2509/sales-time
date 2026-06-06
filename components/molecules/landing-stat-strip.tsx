type LandingStatStripProps = {
  stats: readonly { value: string; label: string }[];
};

export function LandingStatStrip({ stats }: LandingStatStripProps) {
  return (
    <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/4 sm:flex-row">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex-1 border-b border-white/7 px-8 py-[18px] text-center last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
        >
          <p className="text-[26px] font-bold tracking-tight text-white">{stat.value}</p>
          <p className="mt-0.5 text-[11.5px] font-medium text-white/35">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
