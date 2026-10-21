import type { CSSProperties, ReactNode } from "react";
import { Mic, Sparkles, UserRound } from "lucide-react";
import { Icon3d } from "@/components/atoms/icon-3d";
import { cn } from "@/lib/utils";

/** Ce que la scène met au premier plan : l'idée de la page. */
export type OnboardingSceneFocus =
  | "welcome"
  | "record"
  | "score"
  | "analysis"
  | "start";

type CardKind = "wave" | "score" | "tip" | "profile" | "record";

/** Les trois cartes de chaque scène : au fond, au milieu, au premier plan. */
const CARDS: Record<OnboardingSceneFocus, [CardKind, CardKind, CardKind]> = {
  welcome: ["wave", "score", "tip"],
  record: ["score", "wave", "record"],
  score: ["wave", "tip", "score"],
  analysis: ["score", "tip", "profile"],
  start: ["profile", "score", "tip"],
};

const GLASS =
  "rounded-2xl border border-white/15 bg-[linear-gradient(150deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-4 text-white shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md";

const WAVE = [38, 62, 30, 80, 54, 92, 46, 70, 34, 58, 84, 40, 66, 28];

function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.16em] text-white/55 uppercase">
      {children}
    </p>
  );
}

function WaveCard() {
  return (
    <div className="space-y-3">
      <CardLabel>Rendez-vous déposé</CardLabel>
      <div className="flex h-12 items-end gap-1">
        {WAVE.map((h, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-[#7B5CFF] to-[#FF8FB1]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function ScoreCard() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative size-16 shrink-0 rounded-full bg-[conic-gradient(#FFB547_0deg,#FF6B8A_150deg,#8B6CFF_310deg,rgba(255,255,255,0.12)_310deg)] shadow-[0_8px_20px_-6px_rgba(255,107,138,0.7)]">
        <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-[#15121F] text-lg font-semibold tabular-nums">
          86
        </div>
      </div>
      <div className="space-y-1">
        <CardLabel>Votre note</CardLabel>
        <p className="text-sm font-semibold">86 / 100</p>
        <p className="text-[11px] text-[#9EF0C9]">+12 depuis le dernier</p>
      </div>
    </div>
  );
}

function TipCard() {
  return (
    <div className="flex gap-3">
      <Icon3d tone="amber" size="sm">
        <Sparkles />
      </Icon3d>
      <div className="space-y-1">
        <CardLabel>Votre coaching</CardLabel>
        <p className="text-[13px] leading-snug text-white/90">
          « Qu&apos;est-ce qui vous ferait dire oui d&apos;ici juin ? »
        </p>
      </div>
    </div>
  );
}

function ProfileCard() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <Icon3d tone="teal" size="sm">
          <UserRound />
        </Icon3d>
        <CardLabel>Votre prospect</CardLabel>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#FF7A6B]/25 px-2 py-0.5 text-[11px] text-[#FFC2B8]">
          Sécurité
        </span>
        <span className="rounded-full bg-[#FFB547]/25 px-2 py-0.5 text-[11px] text-[#FFE0A8]">
          Argent
        </span>
        <span className="rounded-full bg-[#33D1B5]/25 px-2 py-0.5 text-[11px] text-[#A8F5E6]">
          Stable
        </span>
      </div>
    </div>
  );
}

function RecordCard() {
  return (
    <div className="flex items-center gap-3">
      <Icon3d tone="coral" size="md">
        <Mic />
      </Icon3d>
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#FFB0A8] uppercase">
          <span className="size-2 animate-pulse rounded-full bg-[#FF5A5A] motion-reduce:animate-none" />
          Enregistrement
        </p>
        <p className="text-lg font-semibold tabular-nums">12:04</p>
      </div>
    </div>
  );
}

const CARD: Record<CardKind, () => ReactNode> = {
  wave: WaveCard,
  score: ScoreCard,
  tip: TipCard,
  profile: ProfileCard,
  record: RecordCard,
};

/** Place un objet dans la scène, à sa profondeur, et le fait flotter. */
function Floating({
  className,
  depth,
  tilt = 0,
  delay,
  children,
}: {
  className: string;
  depth: number;
  tilt?: number;
  delay: number;
  children?: ReactNode;
}) {
  const style: CSSProperties = {
    transform: `translateZ(${depth}px) rotate(${tilt}deg)`,
    animationDelay: `${delay}s`,
  };
  return (
    <div
      className={cn(
        "animate-st-float absolute motion-reduce:animate-none",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

const SPHERE = {
  violet:
    "bg-[radial-gradient(circle_at_32%_28%,#F3F0FF_0%,#9C82FF_28%,#5B3DF5_62%,#24107A_100%)] shadow-[0_24px_40px_-14px_rgba(108,77,255,0.8)]",
  coral:
    "bg-[radial-gradient(circle_at_32%_28%,#FFE9DE_0%,#FF9B7A_30%,#F2547A_65%,#8A1F4E_100%)] shadow-[0_20px_36px_-12px_rgba(255,107,120,0.8)]",
  amber:
    "bg-[radial-gradient(circle_at_32%_28%,#FFF6DA_0%,#FFC96B_32%,#F2902A_70%,#8A4A0A_100%)] shadow-[0_16px_28px_-10px_rgba(255,170,60,0.8)]",
} as const;

type Props = {
  focus: OnboardingSceneFocus;
  className?: string;
};

/**
 * Une petite scène en relief pour les pages d'arrivée : trois cartes de
 * verre en perspective (une analyse, une note, un conseil…) et des sphères
 * brillantes qui flottent autour. La carte du premier plan illustre l'étape.
 *
 * Tout est en CSS : aucune image ni bibliothèque à charger, et le mouvement
 * s'arrête pour qui a demandé moins d'animations.
 */
export function OnboardingScene3d({ focus, className }: Props) {
  const [back, middle, front] = CARDS[focus];
  const Back = CARD[back];
  const Middle = CARD[middle];
  const Front = CARD[front];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative h-[250px] w-[440px] [perspective:1100px]",
        className,
      )}
    >
      <div className="absolute inset-0 [transform:rotateX(12deg)_rotateY(-16deg)] [transform-style:preserve-3d]">
        <Floating
          className={cn(
            "-bottom-2 -left-12 size-20 rounded-full",
            SPHERE.violet,
          )}
          depth={-120}
          delay={-1}
        />
        <div
          className="absolute -right-10 bottom-0 size-28 rounded-full border-[9px] border-[#9C82FF]/55 shadow-[0_0_30px_rgba(139,108,255,0.45),inset_0_0_14px_rgba(255,255,255,0.25)]"
          style={{ transform: "translateZ(-30px) rotateX(66deg)" }}
        />
        <Floating
          className={cn("top-2 left-0 w-[210px]", GLASS)}
          depth={-50}
          tilt={-4}
          delay={-3}
        >
          <Back />
        </Floating>
        <Floating
          className={cn("top-12 right-0 w-[200px]", GLASS)}
          depth={10}
          tilt={3}
          delay={-5}
        >
          <Middle />
        </Floating>
        <Floating
          className={cn(
            GLASS,
            "bottom-0 left-20 w-[236px] border-white/25 bg-[linear-gradient(150deg,rgba(255,255,255,0.2),rgba(255,255,255,0.06))]",
          )}
          depth={70}
          delay={-2}
        >
          <Front />
        </Floating>
        <Floating
          className={cn("-top-3 right-14 size-14 rounded-full", SPHERE.coral)}
          depth={110}
          delay={-4}
        />
        <Floating
          className={cn("right-2 bottom-8 size-8 rounded-full", SPHERE.amber)}
          depth={140}
          delay={-6}
        />
      </div>
    </div>
  );
}

/**
 * La même scène, réduite, dans un bandeau sombre en haut de page : sur
 * mobile, la colonne de gauche est masquée et la page perdait tout son relief.
 */
export function OnboardingMobileHero({
  focus,
}: {
  focus: OnboardingSceneFocus;
}) {
  return (
    <div className="relative mb-6 flex h-[224px] items-center justify-center overflow-hidden rounded-2xl bg-[#06060A] lg:hidden">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-[260px] w-[420px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(108,77,255,0.35)_0%,transparent_68%)]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[240px] w-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,122,107,0.22)_0%,transparent_65%)]" />
      <OnboardingScene3d
        focus={focus}
        className="shrink-0 translate-y-2 scale-[0.64]"
      />
    </div>
  );
}
