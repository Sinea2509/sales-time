import { cn } from "@/lib/utils";
import type { RankingTierId } from "@/src/core/domain/team-ranking";

/**
 * Le métal de chaque médaille : un dégradé éclairé par le haut, un liseré plus
 * sombre et une ombre teintée, dans l'esprit des icônes en relief de la charte.
 * Le diamant prend le bleu glacé et le violet de la marque.
 */
const METAL: Record<
  RankingTierId,
  { face: string; rim: string; shadow: string; ink: string; ribbon: string }
> = {
  demarrage: {
    face: "radial-gradient(circle at 32% 26%, #FCE3CC 0%, #E2A06C 34%, #B66A35 68%, #7E4320 100%)",
    rim: "#8C4F27",
    shadow: "rgba(150, 82, 38, 0.55)",
    ink: "#FFF4EA",
    ribbon: "#C9784A",
  },
  progression: {
    face: "radial-gradient(circle at 32% 26%, #FFFFFF 0%, #DDE2EA 34%, #A7B0C0 68%, #6E788C 100%)",
    rim: "#7D8698",
    shadow: "rgba(90, 100, 125, 0.5)",
    ink: "#FFFFFF",
    ribbon: "#8E98AC",
  },
  maitrise: {
    face: "radial-gradient(circle at 32% 26%, #FFF6D2 0%, #FFD45E 34%, #E9A21F 68%, #A9690A 100%)",
    rim: "#B47712",
    shadow: "rgba(214, 150, 30, 0.6)",
    ink: "#FFFBEA",
    ribbon: "#6C4DFF",
  },
  excellence: {
    face: "conic-gradient(from 200deg, #E8F8FF, #9BE1F7, #C9BDFF, #7B5CFF, #9BE1F7, #E8F8FF, #C9BDFF, #E8F8FF)",
    rim: "#5B3DF5",
    shadow: "rgba(108, 77, 255, 0.6)",
    ink: "#FFFFFF",
    ribbon: "#33D1B5",
  },
};

const SIZES = {
  xs: { box: 18, ribbon: false },
  sm: { box: 26, ribbon: false },
  md: { box: 44, ribbon: true },
  lg: { box: 76, ribbon: true },
  xl: { box: 112, ribbon: true },
} as const;

/** Une étoile à cinq branches, centrée sur la face de la médaille. */
function Star({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[46%] w-[46%]" aria-hidden>
      <path
        d="M12 2.6l2.86 5.8 6.4.93-4.63 4.51 1.09 6.37L12 17.2l-5.72 3.01 1.09-6.37L2.74 9.33l6.4-.93z"
        fill={color}
        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" }}
      />
    </svg>
  );
}

/** Un diamant taillé, pour la plus haute médaille. */
function Gem({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[50%] w-[50%]" aria-hidden>
      <path
        d="M6 4h12l4 5-10 12L2 9z"
        fill={color}
        style={{ filter: "drop-shadow(0 1px 1px rgba(40,20,120,0.35))" }}
      />
      <path
        d="M2 9h20M8 4l4 17M16 4l-4 17M8 4L6 9l6 12 6-12-2-5"
        fill="none"
        stroke="rgba(91,61,245,0.45)"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/**
 * Une médaille en relief : Bronze, Argent, Or ou Diamant.
 *
 * Décision de Thomas du 23 octobre 2026 : les paliers deviennent des
 * médailles, pour tout le monde. Elle est dessinée ici plutôt qu'importée en
 * image : elle reste nette à toutes les tailles, de la pastille d'un tableau à
 * la grande médaille de la fiche, et un rendu 3D de la charte pourra la
 * remplacer sans rien toucher d'autre.
 *
 * Décorative : le nom de la médaille est toujours écrit à côté.
 */
export function Medal({
  tier,
  size = "md",
  className,
}: {
  tier: RankingTierId;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const metal = METAL[tier];
  const { box, ribbon } = SIZES[size];
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: box, height: ribbon ? box * 1.22 : box }}
    >
      {ribbon ? (
        <>
          <span
            className="absolute bottom-0 left-[22%] w-[24%]"
            style={{
              height: "46%",
              background: metal.ribbon,
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
              transform: "rotate(14deg)",
              transformOrigin: "top center",
            }}
          />
          <span
            className="absolute right-[22%] bottom-0 w-[24%]"
            style={{
              height: "46%",
              background: metal.ribbon,
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
              transform: "rotate(-14deg)",
              transformOrigin: "top center",
              filter: "brightness(0.85)",
            }}
          />
        </>
      ) : null}
      <span
        className="absolute top-0 left-0 grid place-items-center rounded-full"
        style={{
          width: box,
          height: box,
          background: metal.face,
          boxShadow: `inset 0 0 0 ${Math.max(1.5, box * 0.05)}px ${metal.rim}, inset 0 ${box * 0.06}px ${box * 0.08}px rgba(255,255,255,0.55), inset 0 -${box * 0.07}px ${box * 0.12}px rgba(0,0,0,0.22), 0 ${box * 0.12}px ${box * 0.24}px -${box * 0.08}px ${metal.shadow}`,
        }}
      >
        <span
          className="pointer-events-none absolute inset-x-[16%] top-[7%] h-[38%] rounded-[50%] bg-gradient-to-b from-white/60 to-transparent"
          aria-hidden
        />
        {tier === "excellence" ? (
          <Gem color={metal.ink} />
        ) : (
          <Star color={metal.ink} />
        )}
      </span>
    </span>
  );
}
