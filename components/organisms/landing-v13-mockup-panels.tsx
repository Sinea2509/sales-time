/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Les quatre panneaux de l'aperçu, dans l'ordre des onglets. */
export const LANDING_V13_MOCKUP_PANELS = [
  <div
    key={0}
    style={{
      background: "rgb(243, 244, 250)",
      color: "rgb(11, 13, 36)",
      borderRadius: "16px 16px 0px 0px",
      padding: "clamp(18px, 3vw, 32px)",
      minHeight: "400px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgb(230, 234, 255)",
            color: "rgb(61, 82, 217)",
            display: "grid",
            placeItems: "center",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          AL
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Antoine Lambert · TechVision
          </span>
          <span style={{ fontSize: "13px", color: "rgb(86, 91, 122)" }}>
            RDV de découverte · 48 min · aujourd&apos;hui
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: "600",
          background: "rgb(255, 255, 255)",
          color: "rgb(61, 82, 217)",
          padding: "7px 12px",
          borderRadius: "999px",
          border: "1px solid rgb(227, 229, 240)",
        }}
      >
        ✦ Fiche générée en 2 min
      </span>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "14px",
      }}
    >
      <div
        style={{
          background: "rgb(255, 255, 255)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontFamily: '"Geist Mono", monospace',
            fontSize: "11px",
            color: "rgb(122, 127, 158)",
            letterSpacing: "0.06em",
          }}
        >
          SYNTHÈSE
        </span>
        <p
          style={{
            fontSize: "15px",
            lineHeight: "1.55",
            color: "rgb(30, 33, 64)",
          }}
        >
          TechVision cherche à réduire de 30 % son temps de reporting commercial
          avant le T2. Décideur final : le DAF ; budget en cours
          d&apos;arbitrage.
        </p>
      </div>
      <div
        style={{
          background: "rgb(255, 255, 255)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontFamily: '"Geist Mono", monospace',
            fontSize: "11px",
            color: "rgb(122, 127, 158)",
            letterSpacing: "0.06em",
          }}
        >
          ENJEUX IDENTIFIÉS
        </span>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            fontSize: "14px",
            lineHeight: "1.45",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgb(91, 116, 255), rgb(155, 123, 255))",
              marginTop: "7px",
              flex: "0 0 auto",
            }}
          />
          Reporting manuel chronophage (≈ 5 h / semaine)
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            fontSize: "14px",
            lineHeight: "1.45",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgb(91, 116, 255), rgb(155, 123, 255))",
              marginTop: "7px",
              flex: "0 0 auto",
            }}
          />
          Données CRM incomplètes
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            fontSize: "14px",
            lineHeight: "1.45",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgb(91, 116, 255), rgb(155, 123, 255))",
              marginTop: "7px",
              flex: "0 0 auto",
            }}
          />
          Validation budgétaire par le DAF
        </div>
      </div>
      <div
        style={{
          background: "rgb(255, 255, 255)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontFamily: '"Geist Mono", monospace',
            fontSize: "11px",
            color: "rgb(122, 127, 158)",
            letterSpacing: "0.06em",
          }}
        >
          PROCHAINES ÉTAPES
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "14px",
            padding: "10px 12px",
            background: "rgb(243, 244, 250)",
            borderRadius: "10px",
          }}
        >
          <span>Envoyer le benchmark sectoriel</span>
          <span
            style={{
              color: "rgb(61, 82, 217)",
              fontWeight: "600",
              flex: "0 0 auto",
            }}
          >
            Jeu.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "14px",
            padding: "10px 12px",
            background: "rgb(243, 244, 250)",
            borderRadius: "10px",
          }}
        >
          <span>Proposition de pilote</span>
          <span
            style={{
              color: "rgb(61, 82, 217)",
              fontWeight: "600",
              flex: "0 0 auto",
            }}
          >
            Lun.
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            fontSize: "14px",
            padding: "10px 12px",
            background: "rgb(243, 244, 250)",
            borderRadius: "10px",
          }}
        >
          <span>RDV avec le DAF</span>
          <span
            style={{
              color: "rgb(61, 82, 217)",
              fontWeight: "600",
              flex: "0 0 auto",
            }}
          >
            S+2
          </span>
        </div>
      </div>
    </div>
  </div>,
  <div
    key={1}
    style={{
      background: "rgb(243, 244, 250)",
      color: "rgb(11, 13, 36)",
      borderRadius: "16px 16px 0px 0px",
      padding: "clamp(18px, 3vw, 32px)",
      minHeight: "400px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgb(230, 234, 255)",
            color: "rgb(61, 82, 217)",
            display: "grid",
            placeItems: "center",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          AL
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Antoine Lambert · TechVision
          </span>
          <span style={{ fontSize: "13px", color: "rgb(86, 91, 122)" }}>
            RDV de découverte · 48 min · aujourd&apos;hui
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: "600",
          background: "rgb(255, 255, 255)",
          color: "rgb(61, 82, 217)",
          padding: "7px 12px",
          borderRadius: "999px",
          border: "1px solid rgb(227, 229, 240)",
        }}
      >
        ✦ Fiche générée en 2 min
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <span
          style={{
            fontSize: "52px",
            fontWeight: "700",
            letterSpacing: "-0.05em",
            background:
              "linear-gradient(100deg, rgb(91, 116, 255), rgb(155, 123, 255)) text",
            color: "transparent",
          }}
        >
          7
        </span>
        <span
          style={{
            fontSize: "20px",
            color: "rgb(122, 127, 158)",
            fontWeight: "500",
          }}
        >
          /10 · Score KISS
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "rgb(255, 255, 255)",
            borderRadius: "16px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontFamily: '"Geist Mono", monospace',
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.06em",
              padding: "4px 9px",
              borderRadius: "6px",
              background: "rgb(7, 8, 26)",
              color: "rgb(255, 255, 255)",
            }}
          >
            KEEP
          </span>
          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Très bonne écoute active. Excellentes questions de découverte.
          </span>
        </div>
        <div
          style={{
            background: "rgb(255, 255, 255)",
            borderRadius: "16px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontFamily: '"Geist Mono", monospace',
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.06em",
              padding: "4px 9px",
              borderRadius: "6px",
              background: "rgb(230, 234, 255)",
              color: "rgb(61, 82, 217)",
            }}
          >
            IMPROVE
          </span>
          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Challenger davantage sur le budget avant la proposition.
          </span>
        </div>
        <div
          style={{
            background: "rgb(255, 255, 255)",
            borderRadius: "16px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontFamily: '"Geist Mono", monospace',
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.06em",
              padding: "4px 9px",
              borderRadius: "6px",
              background: "rgb(239, 233, 255)",
              color: "rgb(106, 79, 217)",
            }}
          >
            START
          </span>
          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Créer de l&apos;urgence via des benchmarks sectoriels.
          </span>
        </div>
        <div
          style={{
            background: "rgb(255, 255, 255)",
            borderRadius: "16px",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontFamily: '"Geist Mono", monospace',
              fontSize: "11px",
              fontWeight: "500",
              letterSpacing: "0.06em",
              padding: "4px 9px",
              borderRadius: "6px",
              background: "rgb(237, 239, 247)",
              color: "rgb(86, 91, 122)",
            }}
          >
            STOP
          </span>
          <span style={{ fontSize: "14px", lineHeight: "1.5" }}>
            Promettre un POC gratuit sans accord de principe.
          </span>
        </div>
      </div>
      <div
        style={{
          background: "rgb(7, 8, 26)",
          color: "rgb(242, 243, 250)",
          borderRadius: "16px",
          padding: "16px 20px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background:
              "linear-gradient(100deg, rgb(91, 116, 255), rgb(155, 123, 255))",
            color: "rgb(255, 255, 255)",
            fontSize: "11px",
            fontWeight: "700",
            padding: "4px 10px",
            borderRadius: "999px",
          }}
        >
          GOLDEN QUESTION
        </span>
        <span style={{ fontSize: "15px" }}>
          « Que se passe-t-il si rien ne change d&apos;ici la fin du trimestre ?
          »
        </span>
      </div>
    </div>
  </div>,
  <div
    key={2}
    style={{
      background: "rgb(243, 244, 250)",
      color: "rgb(11, 13, 36)",
      borderRadius: "16px 16px 0px 0px",
      padding: "clamp(18px, 3vw, 32px)",
      minHeight: "400px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgb(230, 234, 255)",
            color: "rgb(61, 82, 217)",
            display: "grid",
            placeItems: "center",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          AL
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Antoine Lambert · TechVision
          </span>
          <span style={{ fontSize: "13px", color: "rgb(86, 91, 122)" }}>
            RDV de découverte · 48 min · aujourd&apos;hui
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: "600",
          background: "rgb(255, 255, 255)",
          color: "rgb(61, 82, 217)",
          padding: "7px 12px",
          borderRadius: "999px",
          border: "1px solid rgb(227, 229, 240)",
        }}
      >
        ✦ Fiche générée en 2 min
      </span>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
        gap: "14px",
      }}
    >
      <div
        style={{
          background: "rgb(255, 255, 255)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <span
          style={{
            fontFamily: '"Geist Mono", monospace',
            fontSize: "11px",
            color: "rgb(122, 127, 158)",
            letterSpacing: "0.06em",
          }}
        >
          PROFIL DISC · DOMINANT
        </span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "22px minmax(0px, 1fr) 40px",
            gap: "12px",
            alignItems: "center",
            fontSize: "14px",
          }}
        >
          <span style={{ fontWeight: "700" }}>D</span>
          <div
            style={{
              height: "10px",
              borderRadius: "5px",
              background: "rgb(237, 239, 247)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "65%",
                background:
                  "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                borderRadius: "5px",
                opacity: "1",
              }}
            />
          </div>
          <span style={{ textAlign: "right", color: "rgb(86, 91, 122)" }}>
            65%
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "22px minmax(0px, 1fr) 40px",
            gap: "12px",
            alignItems: "center",
            fontSize: "14px",
          }}
        >
          <span style={{ fontWeight: "700" }}>I</span>
          <div
            style={{
              height: "10px",
              borderRadius: "5px",
              background: "rgb(237, 239, 247)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "30%",
                background:
                  "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                borderRadius: "5px",
                opacity: "0.5",
              }}
            />
          </div>
          <span style={{ textAlign: "right", color: "rgb(86, 91, 122)" }}>
            30%
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "22px minmax(0px, 1fr) 40px",
            gap: "12px",
            alignItems: "center",
            fontSize: "14px",
          }}
        >
          <span style={{ fontWeight: "700" }}>S</span>
          <div
            style={{
              height: "10px",
              borderRadius: "5px",
              background: "rgb(237, 239, 247)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "35%",
                background:
                  "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                borderRadius: "5px",
                opacity: "0.5",
              }}
            />
          </div>
          <span style={{ textAlign: "right", color: "rgb(86, 91, 122)" }}>
            35%
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "22px minmax(0px, 1fr) 40px",
            gap: "12px",
            alignItems: "center",
            fontSize: "14px",
          }}
        >
          <span style={{ fontWeight: "700" }}>C</span>
          <div
            style={{
              height: "10px",
              borderRadius: "5px",
              background: "rgb(237, 239, 247)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: "20%",
                background:
                  "linear-gradient(90deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                borderRadius: "5px",
                opacity: "0.5",
              }}
            />
          </div>
          <span style={{ textAlign: "right", color: "rgb(86, 91, 122)" }}>
            20%
          </span>
        </div>
      </div>
      <div
        style={{
          background: "rgb(255, 255, 255)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <span
          style={{
            fontFamily: '"Geist Mono", monospace',
            fontSize: "11px",
            color: "rgb(122, 127, 158)",
            letterSpacing: "0.06em",
          }}
        >
          LEVIERS SONCAS
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgb(7, 8, 26)",
              color: "rgb(255, 255, 255)",
            }}
          >
            Sécurité
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgb(237, 239, 247)",
              color: "rgb(138, 143, 174)",
            }}
          >
            Orgueil
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgb(237, 239, 247)",
              color: "rgb(138, 143, 174)",
            }}
          >
            Nouveauté
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgb(7, 8, 26)",
              color: "rgb(255, 255, 255)",
            }}
          >
            Confort
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgb(7, 8, 26)",
              color: "rgb(255, 255, 255)",
            }}
          >
            Argent
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "7px 12px",
              borderRadius: "999px",
              background: "rgb(237, 239, 247)",
              color: "rgb(138, 143, 174)",
            }}
          >
            Sympathie
          </span>
        </div>
        <p
          style={{
            fontSize: "14px",
            lineHeight: "1.5",
            color: "rgb(30, 33, 64)",
            background: "rgb(243, 244, 250)",
            borderRadius: "12px",
            padding: "12px 14px",
          }}
        >
          « Ce qui compte, c&apos;est d&apos;avoir des chiffres fiables vite,
          sans courir après les équipes. »
        </p>
      </div>
    </div>
  </div>,
  <div
    key={3}
    style={{
      background: "rgb(243, 244, 250)",
      color: "rgb(11, 13, 36)",
      borderRadius: "16px 16px 0px 0px",
      padding: "clamp(18px, 3vw, 32px)",
      minHeight: "400px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "rgb(230, 234, 255)",
            color: "rgb(61, 82, 217)",
            display: "grid",
            placeItems: "center",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          AL
        </span>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Antoine Lambert · TechVision
          </span>
          <span style={{ fontSize: "13px", color: "rgb(86, 91, 122)" }}>
            RDV de découverte · 48 min · aujourd&apos;hui
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: "600",
          background: "rgb(255, 255, 255)",
          color: "rgb(61, 82, 217)",
          padding: "7px 12px",
          borderRadius: "999px",
          border: "1px solid rgb(227, 229, 240)",
        }}
      >
        ✦ Fiche générée en 2 min
      </span>
    </div>
    <div
      style={{
        background: "rgb(255, 255, 255)",
        borderRadius: "16px",
        overflow: "hidden",
        maxWidth: "760px",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgb(237, 239, 247)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "14px",
        }}
      >
        <span>
          <span style={{ color: "rgb(122, 127, 158)" }}>À :</span>{" "}
          antoine.lambert@techvision.fr
        </span>
        <span>
          <span style={{ color: "rgb(122, 127, 158)" }}>Objet :</span> Suite à
          notre échange, prochaines étapes
        </span>
      </div>
      <div
        style={{
          padding: "20px",
          fontSize: "15px",
          lineHeight: "1.6",
          color: "rgb(30, 33, 64)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <p>Bonjour Antoine,</p>
        <p>
          Merci pour votre temps aujourd&apos;hui. Pour rappel, votre priorité
          est de réduire de 30 % le temps de reporting de l&apos;équipe avant le
          T2.
        </p>
        <p>
          Comme convenu, je vous envoie d&apos;ici jeudi un benchmark sectoriel
          et une proposition de pilote à présenter à votre DAF.
        </p>
      </div>
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid rgb(237, 239, 247)",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background:
              "linear-gradient(100deg, rgb(91, 116, 255), rgb(139, 120, 255))",
            color: "rgb(255, 255, 255)",
            fontSize: "13px",
            fontWeight: "600",
            padding: "9px 16px",
            borderRadius: "999px",
          }}
        >
          Copier le mail
        </span>
        <span
          style={{
            border: "1px solid rgb(227, 229, 240)",
            fontSize: "13px",
            fontWeight: "600",
            padding: "9px 16px",
            borderRadius: "999px",
          }}
        >
          Modifier
        </span>
      </div>
    </div>
  </div>,
];
