/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Les quatre fonctionnalités, en cartes. */
export function LandingV13Features() {
  return (
    <section
      id="features"
      style={{
        background: "rgb(243, 244, 250)",
        color: "rgb(11, 13, 36)",
        padding: "96px 24px 120px",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0px auto" }}>
        <div
          data-reveal=""
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "820px",
            marginBottom: "56px",
          }}
        >
          <span
            style={{
              fontFamily: '"Geist Mono", monospace',
              fontSize: "12px",
              letterSpacing: "0.1em",
              color: "rgb(61, 82, 217)",
            }}
          >
            FONCTIONNALITÉS
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
            De la fin du RDV à la fiche structurée,{" "}
            <span style={{ color: "rgb(138, 143, 174)" }}>
              tout ce dont votre équipe a besoin.
            </span>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 520px), 1fr))",
            gap: "16px",
          }}
        >
          <div
            data-reveal=""
            style={{
              background: "rgb(255, 255, 255)",
              color: "rgb(11, 13, 36)",
              borderRadius: "26px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "300px",
              border: "1px solid rgb(227, 229, 240)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "rgb(230, 234, 255)",
                  color: "rgb(61, 82, 217)",
                }}
              >
                01
              </span>
              <span
                style={{
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  opacity: "0.7",
                }}
              >
                REPORTING
              </span>
            </div>
            <h3
              style={{
                marginTop: "auto",
                fontSize: "28px",
                lineHeight: "1.08",
                letterSpacing: "-0.04em",
                fontWeight: "700",
                textWrap: "balance",
              }}
            >
              Reporting de RDV structuré
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                opacity: "0.78",
                textWrap: "pretty",
              }}
            >
              Métadonnées, synthèse du contexte et des enjeux, pistes de
              solution, prête à partager ou à archiver dans votre CRM.
            </p>
          </div>
          <div
            data-reveal=""
            style={{
              background: "rgb(7, 8, 26)",
              color: "rgb(242, 243, 250)",
              borderRadius: "26px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "300px",
              border: "1px solid rgb(7, 8, 26)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "linear-gradient(135deg, rgb(91, 116, 255), rgb(155, 123, 255))",
                  color: "rgb(255, 255, 255)",
                }}
              >
                02
              </span>
              <span
                style={{
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  opacity: "0.7",
                }}
              >
                COACHING
              </span>
            </div>
            <h3
              style={{
                marginTop: "auto",
                fontSize: "28px",
                lineHeight: "1.08",
                letterSpacing: "-0.04em",
                fontWeight: "700",
                textWrap: "balance",
              }}
            >
              Débriefing et coaching personnalisé après chaque RDV
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                opacity: "0.78",
                textWrap: "pretty",
              }}
            >
              Ce qu&apos;il faut garder, améliorer, arrêter et commencer, adapté
              au profil DISC/SONCAS du prospect. Golden question incluse.
            </p>
          </div>
          <div
            data-reveal=""
            style={{
              background:
                "linear-gradient(150deg, rgb(91, 116, 255), rgb(155, 123, 255))",
              color: "rgb(255, 255, 255)",
              borderRadius: "26px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "300px",
              border: "1px solid transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "rgb(255, 255, 255)",
                  color: "rgb(91, 95, 232)",
                }}
              >
                03
              </span>
              <span
                style={{
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  opacity: "0.7",
                }}
              >
                SUIVI
              </span>
            </div>
            <h3
              style={{
                marginTop: "auto",
                fontSize: "28px",
                lineHeight: "1.08",
                letterSpacing: "-0.04em",
                fontWeight: "700",
                textWrap: "balance",
              }}
            >
              Mail de suivi prêt à envoyer
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                opacity: "0.78",
                textWrap: "pretty",
              }}
            >
              Remerciement, rappel des enjeux, prochaines étapes : un mail
              structuré, modifiable avant envoi.
            </p>
          </div>
          <div
            data-reveal=""
            style={{
              background: "rgb(255, 255, 255)",
              color: "rgb(11, 13, 36)",
              borderRadius: "26px",
              padding: "36px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "300px",
              border: "1px solid rgb(227, 229, 240)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "rgb(239, 233, 255)",
                  color: "rgb(106, 79, 217)",
                }}
              >
                04
              </span>
              <span
                style={{
                  fontFamily: '"Geist Mono", monospace',
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  opacity: "0.7",
                }}
              >
                PILOTAGE
              </span>
            </div>
            <h3
              style={{
                marginTop: "auto",
                fontSize: "28px",
                lineHeight: "1.08",
                letterSpacing: "-0.04em",
                fontWeight: "700",
                textWrap: "balance",
              }}
            >
              Dashboard manager
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                opacity: "0.78",
                textWrap: "pretty",
              }}
            >
              Volumes, TAM agrégé, répartition des types de RDV et thématiques
              KISS, sans exposer les scores individuels.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
