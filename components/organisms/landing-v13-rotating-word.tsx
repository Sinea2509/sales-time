"use client";

import { useEffect, useState } from "react";

/*
  Le mot qui change à la fin du titre de la landing v13 : « s'occupe du
  reste. », « du reporting. », etc., toutes les 2,4 secondes, comme dans la
  maquette de Thomas.
*/
const WORDS = [
  "reste.",
  "reporting.",
  "mail de suivi.",
  "coaching.",
  "propale.",
];
const ARTICLES = ["du", "du", "du", "du", "de la"];

export function LandingV13RotatingWord() {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setW((s) => (s + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {ARTICLES[w]}{" "}
      <span
        key={w}
        style={{
          display: "inline-block",
          background: "linear-gradient(100deg,#7D90FF,#B59BFF 55%,#D9B8FF)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          animation: "stWord 0.7s cubic-bezier(.2,.7,.2,1)",
          paddingRight: "0.04em",
        }}
      >
        {WORDS[w]}
      </span>
    </>
  );
}
