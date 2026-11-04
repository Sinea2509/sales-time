import Link from "next/link";
/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Le dernier appel à l'action. */
export function LandingV13Cta() {
  return (
    <section
      style={{
        position: "relative",
        padding: "150px 24px 110px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-420px",
          transform: "translateX(-50%)",
          width: "1300px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(107, 116, 255, 0.45), rgba(155, 123, 255, 0.15) 55%, rgba(7, 8, 26, 0) 80%)",
          pointerEvents: "none",
        }}
      />
      <div
        data-reveal=""
        style={{
          position: "relative",
          maxWidth: "900px",
          margin: "0px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "26px",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(44px, 7vw, 88px)",
            lineHeight: "1",
            letterSpacing: "-0.055em",
            fontWeight: "700",
            textWrap: "balance",
          }}
        >
          Prêt à transformer{" "}
          <span
            style={{
              background:
                "linear-gradient(100deg, rgb(125, 144, 255), rgb(181, 155, 255) 60%, rgb(217, 184, 255)) text",
              color: "transparent",
            }}
          >
            vos rendez-vous ?
          </span>
        </h2>
        <p
          style={{
            fontSize: "19px",
            color: "rgb(154, 159, 192)",
            maxWidth: "540px",
          }}
        >
          Créez votre espace, invitez votre équipe et lancez la première analyse
          en quelques minutes.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/sign-up"
            style={{
              background:
                "linear-gradient(100deg, rgb(91, 116, 255), rgb(139, 120, 255))",
              color: "rgb(255, 255, 255)",
              fontWeight: "600",
              fontSize: "16px",
              padding: "16px 28px",
              borderRadius: "999px",
              boxShadow:
                "rgba(107, 116, 255, 0.8) 0px 12px 40px -10px, rgba(255, 255, 255, 0.25) 0px 1px 0px inset",
            }}
          >
            Essayer gratuitement
          </Link>
          <Link
            href="/sign-in"
            style={{
              color: "rgb(242, 243, 250)",
              fontWeight: "600",
              fontSize: "16px",
              padding: "16px 28px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
            }}
          >
            Connexion
          </Link>
        </div>
        <span style={{ fontSize: "13px", color: "rgb(107, 112, 150)" }}>
          Hébergement UE · Rôles &amp; accès inclus · Pas de carte bancaire
        </span>
      </div>
    </section>
  );
}
