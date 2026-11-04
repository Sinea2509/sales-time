/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Les trois étapes. */
export function LandingV13How() {
  return (
    <section id="how" style={{ padding: "0px 24px 128px" }}>
      <div style={{ maxWidth: "1160px", margin: "0px auto" }}>
        <div
          data-reveal=""
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "700px",
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
            SIMPLE PAR DESIGN
          </span>
          <h2
            style={{
              fontSize: "clamp(38px, 5.4vw, 64px)",
              lineHeight: "1.02",
              letterSpacing: "-0.05em",
              fontWeight: "700",
            }}
          >
            Trois étapes.{" "}
            <span style={{ color: "rgb(107, 112, 150)" }}>Zéro friction.</span>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "16px",
          }}
        >
          <div
            data-reveal=""
            style={{
              background: "rgb(14, 16, 41)",
              border: "1px solid rgb(31, 35, 67)",
              borderRadius: "26px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <span
              style={{
                fontSize: "80px",
                fontWeight: "700",
                lineHeight: "1",
                letterSpacing: "-0.06em",
                background:
                  "linear-gradient(rgb(125, 144, 255), rgba(155, 123, 255, 0.15)) text",
                color: "transparent",
                alignSelf: "flex-start",
              }}
            >
              01
            </span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "-0.03em",
              }}
            >
              Collez votre transcript
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                color: "rgb(154, 159, 192)",
                textWrap: "pretty",
              }}
            >
              Après le RDV, importez ou collez le texte issu de votre visio ou
              enregistrement. Tout format texte fonctionne.
            </p>
          </div>
          <div
            data-reveal=""
            style={{
              background: "rgb(14, 16, 41)",
              border: "1px solid rgb(31, 35, 67)",
              borderRadius: "26px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <span
              style={{
                fontSize: "80px",
                fontWeight: "700",
                lineHeight: "1",
                letterSpacing: "-0.06em",
                background:
                  "linear-gradient(rgb(125, 144, 255), rgba(155, 123, 255, 0.15)) text",
                color: "transparent",
                alignSelf: "flex-start",
              }}
            >
              02
            </span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "-0.03em",
              }}
            >
              L&apos;IA génère la fiche RDV
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                color: "rgb(154, 159, 192)",
                textWrap: "pretty",
              }}
            >
              Synthèse, coaching KISS, profil DISC/SONCAS avec verbatims et mail
              de suivi, en quelques minutes.
            </p>
          </div>
          <div
            data-reveal=""
            style={{
              background: "rgb(14, 16, 41)",
              border: "1px solid rgb(31, 35, 67)",
              borderRadius: "26px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <span
              style={{
                fontSize: "80px",
                fontWeight: "700",
                lineHeight: "1",
                letterSpacing: "-0.06em",
                background:
                  "linear-gradient(rgb(125, 144, 255), rgba(155, 123, 255, 0.15)) text",
                color: "transparent",
                alignSelf: "flex-start",
              }}
            >
              03
            </span>
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "700",
                letterSpacing: "-0.03em",
              }}
            >
              Suivez vos progrès
            </h3>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.55",
                color: "rgb(154, 159, 192)",
                textWrap: "pretty",
              }}
            >
              Le tableau de bord cumule votre TAM, vos tendances et les
              prochaines actions à prioriser.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
