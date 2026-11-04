"use client";

import { useState } from "react";

/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

const FAQ = [
  [
    "Mes transcripts et analyses sont-ils confidentiels ?",
    "Oui. Les données sont hébergées dans l'UE, chiffrées, et restent votre propriété. Elles ne servent jamais à entraîner des modèles tiers.",
  ],
  [
    "Faut-il une intégration CRM pour commencer ?",
    "Non. Collez un transcript et obtenez votre fiche RDV immédiatement. La fiche peut ensuite être copiée ou archivée dans votre CRM.",
  ],
  [
    "L'IA remplace-t-elle le manager commercial ?",
    "Non. Sales Time prépare le débrief et met en lumière les axes de progrès ; le manager garde la main sur le coaching.",
  ],
  [
    "Quels formats de transcript sont acceptés ?",
    "Tout format texte : export Teams, Zoom, Google Meet, outil d'enregistrement ou simple copier-coller.",
  ],
  [
    "Puis-je inviter toute l'équipe ?",
    "Oui. Invitez vos commerciaux et managers depuis votre espace, avec des rôles et accès adaptés.",
  ],
] as const;

/** Les questions fréquentes ; une seule réponse ouverte à la fois, la première au départ. */
export function LandingV13Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section
      id="faq"
      style={{
        background: "rgb(243, 244, 250)",
        color: "rgb(11, 13, 36)",
        padding: "0px 24px 120px",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0px auto",
          display: "flex",
          flexDirection: "column",
          gap: "40px",
        }}
      >
        <h2
          data-reveal=""
          style={{
            fontSize: "clamp(38px, 5.4vw, 64px)",
            lineHeight: "1.02",
            letterSpacing: "-0.05em",
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Questions fréquentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {FAQ.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div
                key={q}
                style={{
                  background: "rgb(255, 255, 255)",
                  border: "1px solid rgb(227, 229, 240)",
                  borderRadius: "20px",
                  padding: "0px 24px",
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => (o === i ? -1 : i))}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "0px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    padding: "22px 0px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    alignItems: "center",
                    fontSize: "18px",
                    fontWeight: "600",
                    letterSpacing: "-0.02em",
                    color: "rgb(11, 13, 36)",
                  }}
                >
                  {q}
                  <span
                    style={
                      isOpen
                        ? {
                            width: "34px",
                            height: "34px",
                            flex: "0 0 auto",
                            borderRadius: "50%",
                            background: "rgb(7, 8, 26)",
                            color: "rgb(255, 255, 255)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "20px",
                            fontWeight: "400",
                            transition: "transform 0.3s, background 0.3s",
                            transform: "rotate(45deg)",
                          }
                        : {
                            width: "34px",
                            height: "34px",
                            flex: "0 0 auto",
                            borderRadius: "50%",
                            background: "rgb(237, 239, 247)",
                            color: "rgb(11, 13, 36)",
                            display: "grid",
                            placeItems: "center",
                            fontSize: "20px",
                            fontWeight: "400",
                            transition: "transform 0.3s, background 0.3s",
                            transform: "rotate(0deg)",
                          }
                    }
                  >
                    +
                  </span>
                </button>
                {isOpen ? (
                  <p
                    style={{
                      padding: "0px 0px 22px",
                      fontSize: "16px",
                      lineHeight: "1.6",
                      color: "rgb(86, 91, 122)",
                      maxWidth: "680px",
                    }}
                  >
                    {a}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
