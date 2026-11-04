/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Pour les commerciaux et pour les managers. */
export function LandingV13Roles() {
  return (
    <section
      id="roles"
      style={{
        position: "relative",
        padding: "128px 24px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-200px",
          top: "80px",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(155, 123, 255, 0.22), rgba(155, 123, 255, 0))",
          pointerEvents: "none",
        }}
      />
      <div
        style={{ position: "relative", maxWidth: "1160px", margin: "0px auto" }}
      >
        <div
          data-reveal=""
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "780px",
            marginBottom: "56px",
          }}
        >
          <span
            style={{
              fontFamily: '"Geist Mono", monospace',
              fontSize: "12px",
              letterSpacing: "0.1em",
              color: "rgb(157, 174, 255)",
            }}
          >
            UNE PLATEFORME, DEUX REGARDS
          </span>
          <h2
            style={{
              fontSize: "clamp(38px, 5.4vw, 64px)",
              lineHeight: "1.02",
              letterSpacing: "-0.05em",
              fontWeight: "700",
              textWrap: "balance",
            }}
          >
            Conçu pour{" "}
            <span
              style={{
                background:
                  "linear-gradient(100deg, rgb(125, 144, 255), rgb(181, 155, 255)) text",
                color: "transparent",
              }}
            >
              chaque niveau
            </span>{" "}
            de l&apos;équipe commerciale
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
            gap: "16px",
          }}
        >
          <div
            data-reveal=""
            style={{
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(150deg, rgb(91, 116, 255), rgb(122, 107, 255) 55%, rgb(155, 123, 255))",
              borderRadius: "30px",
              padding: "clamp(28px, 4vw, 44px)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "rgba(91, 116, 255, 0.8) 0px 40px 80px -40px",
            }}
          >
            <span
              style={{
                alignSelf: "flex-start",
                background: "rgba(7, 8, 26, 0.85)",
                color: "rgb(255, 255, 255)",
                fontSize: "13px",
                fontWeight: "600",
                padding: "7px 14px",
                borderRadius: "999px",
              }}
            >
              Pour les commerciaux
            </span>
            <h3
              style={{
                fontSize: "clamp(26px, 3vw, 34px)",
                lineHeight: "1.08",
                letterSpacing: "-0.04em",
                fontWeight: "700",
                color: "rgb(255, 255, 255)",
                textWrap: "balance",
              }}
            >
              Réduisez votre temps administratif, optimisez votre Temps Utile
              Commercial
            </h3>
            <p style={{ fontSize: "16px", color: "rgb(230, 233, 255)" }}>
              Un outil créé par des Sales, pour des Sales.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgb(255, 255, 255)",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: "rgb(255, 255, 255)",
                    color: "rgb(91, 95, 232)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  ✓
                </span>
                Compte rendu de RDV structuré
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgb(255, 255, 255)",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: "rgb(255, 255, 255)",
                    color: "rgb(91, 95, 232)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  ✓
                </span>
                Coaching KISS
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgb(255, 255, 255)",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: "rgb(255, 255, 255)",
                    color: "rgb(91, 95, 232)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  ✓
                </span>
                Mail de suivi prêt à envoyer
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgb(255, 255, 255)",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: "rgb(255, 255, 255)",
                    color: "rgb(91, 95, 232)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  ✓
                </span>
                Profil DISC et SONCAS de votre interlocuteur
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgb(255, 255, 255)",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: "rgb(255, 255, 255)",
                    color: "rgb(91, 95, 232)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  ✓
                </span>
                Préparation automatique du prochain RDV
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                  color: "rgb(255, 255, 255)",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  padding: "12px 14px",
                  borderRadius: "14px",
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    background: "rgb(255, 255, 255)",
                    color: "rgb(91, 95, 232)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  ✓
                </span>
                Sans repasser des heures sur le CRM
              </div>
            </div>
          </div>
          <div
            data-reveal=""
            style={{
              background: "linear-gradient(rgb(18, 20, 47), rgb(12, 14, 36))",
              border: "1px solid rgb(31, 35, 67)",
              borderRadius: "30px",
              padding: "clamp(28px, 4vw, 44px)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <span
              style={{
                alignSelf: "flex-start",
                background: "rgb(242, 243, 250)",
                color: "rgb(7, 8, 26)",
                fontSize: "13px",
                fontWeight: "600",
                padding: "7px 14px",
                borderRadius: "999px",
              }}
            >
              Pour les managers
            </span>
            <h3
              style={{
                fontSize: "clamp(26px, 3vw, 34px)",
                lineHeight: "1.08",
                letterSpacing: "-0.04em",
                fontWeight: "700",
                textWrap: "balance",
              }}
            >
              Pilotez la qualité commerciale, sans exposer les scores
              individuels
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "10px",
              }}
            >
              <div
                style={{
                  background: "rgb(7, 8, 26)",
                  border: "1px solid rgb(31, 35, 67)",
                  borderRadius: "16px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: '"Geist Mono", monospace',
                    fontSize: "10px",
                    color: "rgb(107, 112, 150)",
                    letterSpacing: "0.06em",
                  }}
                >
                  TAM CUMULÉ
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    letterSpacing: "-0.04em",
                  }}
                >
                  3 h 40
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(157, 174, 255)",
                    fontWeight: "600",
                  }}
                >
                  +12 min
                </span>
              </div>
              <div
                style={{
                  background: "rgb(7, 8, 26)",
                  border: "1px solid rgb(31, 35, 67)",
                  borderRadius: "16px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: '"Geist Mono", monospace',
                    fontSize: "10px",
                    color: "rgb(107, 112, 150)",
                    letterSpacing: "0.06em",
                  }}
                >
                  RDV ANALYSÉS
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    letterSpacing: "-0.04em",
                  }}
                >
                  24
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(157, 174, 255)",
                    fontWeight: "600",
                  }}
                >
                  +2
                </span>
              </div>
              <div
                style={{
                  background: "rgb(7, 8, 26)",
                  border: "1px solid rgb(31, 35, 67)",
                  borderRadius: "16px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontFamily: '"Geist Mono", monospace',
                    fontSize: "10px",
                    color: "rgb(107, 112, 150)",
                    letterSpacing: "0.06em",
                  }}
                >
                  TUC OPTIMISÉ
                </span>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    letterSpacing: "-0.04em",
                  }}
                >
                  70%
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(157, 174, 255)",
                    fontWeight: "600",
                  }}
                >
                  +5 %
                </span>
              </div>
            </div>
            <div
              style={{
                background: "rgb(7, 8, 26)",
                border: "1px solid rgb(31, 35, 67)",
                borderRadius: "16px",
                padding: "4px 16px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0px, 1fr) auto 80px",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 0px",
                  borderBottom: "1px solid rgb(22, 26, 54)",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "0px",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>Antoine Lambert</span>
                  <span
                    style={{ fontSize: "12px", color: "rgb(107, 112, 150)" }}
                  >
                    TechVision
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(183, 187, 214)",
                    border: "1px solid rgb(38, 43, 82)",
                    padding: "3px 9px",
                    borderRadius: "999px",
                  }}
                >
                  Découverte
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgb(31, 35, 67)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "64%",
                        background:
                          "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "13px" }}>
                    64
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0px, 1fr) auto 80px",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 0px",
                  borderBottom: "1px solid rgb(22, 26, 54)",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "0px",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>Pierre Charpentier</span>
                  <span
                    style={{ fontSize: "12px", color: "rgb(107, 112, 150)" }}
                  >
                    InnovaGroup
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(183, 187, 214)",
                    border: "1px solid rgb(38, 43, 82)",
                    padding: "3px 9px",
                    borderRadius: "999px",
                  }}
                >
                  Proposition
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgb(31, 35, 67)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "56%",
                        background:
                          "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "13px" }}>
                    56
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0px, 1fr) auto 80px",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 0px",
                  borderBottom: "1px solid rgb(22, 26, 54)",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "0px",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>Mathilde Leroy</span>
                  <span
                    style={{ fontSize: "12px", color: "rgb(107, 112, 150)" }}
                  >
                    DigitechSA
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(183, 187, 214)",
                    border: "1px solid rgb(38, 43, 82)",
                    padding: "3px 9px",
                    borderRadius: "999px",
                  }}
                >
                  Découverte
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgb(31, 35, 67)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "48%",
                        background:
                          "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "13px" }}>
                    48
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0px, 1fr) auto 80px",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px 0px",
                  borderBottom: "1px solid rgb(22, 26, 54)",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "0px",
                  }}
                >
                  <span style={{ fontWeight: "600" }}>Fabien Aubry</span>
                  <span
                    style={{ fontSize: "12px", color: "rgb(107, 112, 150)" }}
                  >
                    BuildPro
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "rgb(183, 187, 214)",
                    border: "1px solid rgb(38, 43, 82)",
                    padding: "3px 9px",
                    borderRadius: "999px",
                  }}
                >
                  Négociation
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgb(31, 35, 67)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "98%",
                        background:
                          "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "13px" }}>
                    98
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
