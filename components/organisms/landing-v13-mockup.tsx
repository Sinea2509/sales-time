"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LANDING_V13_MOCKUP_PANELS } from "@/components/organisms/landing-v13-mockup-panels";

/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

const TABS = [
  "Compte rendu",
  "Coaching KISS",
  "Profil DISC & SONCAS",
  "Mail de suivi",
];
const TAB_ON: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "0px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: "600",
  padding: "8px 15px",
  borderRadius: "999px",
  background: "rgb(242, 243, 250)",
  color: "rgb(7, 8, 26)",
  transition: "background 0.3s, color 0.3s",
};
const TAB_OFF: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "0px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: "600",
  padding: "8px 15px",
  borderRadius: "999px",
  background: "transparent",
  color: "rgb(154, 159, 192)",
  transition: "background 0.3s, color 0.3s",
};

/**
 * L'aperçu de l'outil sous le titre : il se redresse au défilement, et ses
 * onglets tournent seuls toutes les cinq secondes jusqu'au premier clic.
 */
export function LandingV13Mockup() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  const [tabKey, setTabKey] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const el = frameRef.current;
      if (!el) return;
      const p = Math.min(1, Math.max(0, window.scrollY / 520));
      el.style.transform = `rotateX(${16 * (1 - p)}deg) scale(${0.92 + 0.08 * p})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setTab((s) => (s + 1) % TABS.length);
      setTabKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <div
      style={{
        perspective: "1800px",
        maxWidth: "1100px",
        margin: "72px auto 0px",
        position: "relative",
      }}
    >
      <div
        ref={frameRef}
        style={{
          position: "relative",
          transformOrigin: "50% 0px",
          transform: "rotateX(16deg) scale(0.92)",
          transition: "transform 0.1s linear",
          background:
            "linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03))",
          borderWidth: "1px 1px 0px",
          borderStyle: "solid solid none",
          borderColor:
            "rgba(255, 255, 255, 0.12) rgba(255, 255, 255, 0.12) currentcolor",
          borderImage: "none",
          borderRadius: "26px 26px 0px 0px",
          padding: "12px 12px 0px",
          boxShadow: "rgba(107, 116, 255, 0.55) 0px -30px 100px -30px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            padding: "4px 6px 12px",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.18)",
              }}
            />
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.18)",
              }}
            />
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.18)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              background: "rgba(7, 8, 26, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "4px",
              borderRadius: "999px",
              margin: "0px auto",
            }}
          >
            {TABS.map((label, i) => (
              <button
                key={label}
                type="button"
                style={i === tab ? TAB_ON : TAB_OFF}
                onClick={() => {
                  setTab(i);
                  setAuto(false);
                }}
              >
                {label}
                {i === tab && auto ? (
                  <span
                    key={tabKey}
                    style={{
                      position: "absolute",
                      left: 14,
                      right: 14,
                      bottom: 3,
                      height: 2,
                      borderRadius: 1,
                      background: "linear-gradient(90deg,#5B74FF,#9B7BFF)",
                      transformOrigin: "0 50%",
                      animation: "stBar 5s linear forwards",
                    }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
        {LANDING_V13_MOCKUP_PANELS[tab]}
      </div>
    </div>
  );
}
