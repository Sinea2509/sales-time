"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Medal } from "@/components/atoms/medal";
import {
  tierFromSalesScore,
  type RankingTierId,
} from "@/src/core/domain/team-ranking";

/** Combien d'effets chaque médaille déclenche : de plus en plus, du bronze au diamant. */
const SHOW: Record<
  RankingTierId,
  { shine: boolean; glow: boolean; sparks: number; confetti: number }
> = {
  demarrage: { shine: false, glow: false, sparks: 0, confetti: 0 },
  progression: { shine: true, glow: false, sparks: 0, confetti: 0 },
  maitrise: { shine: true, glow: true, sparks: 8, confetti: 0 },
  excellence: { shine: true, glow: true, sparks: 14, confetti: 26 },
};

const GLOW: Record<RankingTierId, string> = {
  demarrage: "rgba(201,120,74,0.5)",
  progression: "rgba(167,176,192,0.6)",
  maitrise: "rgba(255,196,60,0.75)",
  excellence: "rgba(123,92,255,0.7)",
};

const CONFETTI_COLORS = ["#6C4DFF", "#FF7A6B", "#FFB547", "#33D1B5", "#A08CFF"];

const PLAY_MS = 2600;

function seenKey(meetingId: string): string {
  return `st-medal-vue:${meetingId}`;
}

function readSeen(meetingId: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(meetingId)) === "1";
  } catch {
    return true;
  }
}

function markSeen(meetingId: string) {
  try {
    window.localStorage.setItem(seenKey(meetingId), "1");
  } catch {
    // Stockage indisponible : l'animation rejouera, rien de grave.
  }
}

/** Des étincelles régulièrement réparties autour de la médaille. */
function Sparks({ count }: { count: number }) {
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

/** Des confettis qui jaillissent puis retombent, pour le diamant seulement. */
function Confetti({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const spread = (i / (count - 1) - 0.5) * 260;
        const style = {
          "--dx": `${Math.round(spread)}px`,
          "--dy": `${110 + (i % 5) * 18}px`,
          "--rot": `${(i % 2 ? 1 : -1) * (240 + i * 23)}deg`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animation: `st-confetti 1.6s cubic-bezier(0.2,0.7,0.3,1) ${0.45 + (i % 6) * 0.04}s both`,
        } as CSSProperties;
        return (
          <span
            key={i}
            className="pointer-events-none absolute top-1/3 left-1/2 h-2 w-1.5 rounded-[1px]"
            style={style}
            aria-hidden
          />
        );
      })}
    </>
  );
}

/**
 * La médaille d'un rendez-vous, qui fait son entrée la première fois qu'on
 * ouvre la fiche : un rebond pour le bronze, un reflet pour l'argent, un halo
 * et des étincelles pour l'or, une vraie célébration pour le diamant.
 *
 * Demande de Thomas du 23 octobre 2026 : « des animations de plus en plus
 * stylées en fonction du résultat ». L'entrée ne se joue qu'une fois par
 * rendez-vous et par navigateur ; un clic sur la médaille la rejoue.
 */
export function MedalReveal({
  score,
  meetingId,
}: {
  score: number | null;
  meetingId: string;
}) {
  const tier = tierFromSalesScore(score);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!tier || readSeen(meetingId)) return;
    const start = window.setTimeout(() => {
      setPlaying(true);
      markSeen(meetingId);
    }, 400);
    return () => window.clearTimeout(start);
  }, [tier, meetingId]);

  useEffect(() => {
    if (!playing) return;
    const stop = window.setTimeout(() => setPlaying(false), PLAY_MS);
    return () => window.clearTimeout(stop);
  }, [playing]);

  if (!tier) return null;
  const show = SHOW[tier.id];
  const entree =
    tier.id === "excellence"
      ? "st-medal-flip 1.1s cubic-bezier(0.22,1,0.36,1) both"
      : "st-medal-pop 0.75s cubic-bezier(0.22,1,0.36,1) both";

  return (
    <div className="st-medal-anim relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setPlaying(false);
          window.requestAnimationFrame(() => setPlaying(true));
        }}
        className="relative grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        aria-label={`Rejouer l'animation de la ${tier.intitule}`}
        title={`${tier.intitule.charAt(0).toUpperCase()}${tier.intitule.slice(1)}, cliquez pour la rejouer`}
      >
        {playing && show.glow ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 size-[76px] -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${GLOW[tier.id]} 0%, transparent 70%)`,
              animation: "st-medal-glow 1.4s ease-out 0.3s both",
            }}
          />
        ) : null}
        <span
          className="relative overflow-hidden"
          style={playing ? { animation: entree } : undefined}
        >
          <Medal tier={tier.id} size="lg" />
          {playing && show.shine ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              style={{ animation: "st-medal-shine 0.9s ease-in-out 0.7s both" }}
            />
          ) : null}
        </span>
        {playing && show.sparks > 0 ? <Sparks count={show.sparks} /> : null}
        {playing && show.confetti > 0 ? (
          <Confetti count={show.confetti} />
        ) : null}
      </button>
      <span className="text-xs font-semibold">{tier.nom}</span>
      {playing && tier.id === "excellence" ? (
        <span
          className="text-brand absolute -bottom-6 whitespace-nowrap text-xs font-bold"
          style={{ animation: "st-medal-caption 1.2s ease-out both" }}
        >
          Rendez-vous d&apos;exception !
        </span>
      ) : null}
    </div>
  );
}
