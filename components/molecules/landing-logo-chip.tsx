import { LandingLogoMark } from "@/components/atoms/landing-logo-mark";

type LandingLogoChipProps = {
  initials: string;
  name: string;
  color: string;
};

export function LandingLogoChip({ initials, name, color }: LandingLogoChipProps) {
  return (
    <div className="flex cursor-default items-center gap-2 opacity-65 transition-opacity hover:opacity-100">
      <LandingLogoMark initials={initials} color={color} />
      <span className="text-[14.5px] font-semibold tracking-tight text-zinc-600">{name}</span>
    </div>
  );
}
