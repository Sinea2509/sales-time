import Link from "next/link";
import { LandingV13Mockup } from "@/components/organisms/landing-v13-mockup";
import { LandingV13RotatingWord } from "@/components/organisms/landing-v13-rotating-word";

/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Le haut de page : titre, sous-titre, appels à l'action et aperçu de l'outil. */
export function LandingV13Hero() {
  return (
    <section style={{ position: "relative", padding: "32px 24px 0px" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "-260px",
          width: "1100px",
          height: "760px",
          pointerEvents: "none",
          animation: "24s linear 0s infinite normal none running stAurora",
          background:
            "conic-gradient(rgba(91, 116, 255, 0.35), rgba(155, 123, 255, 0.28), rgba(198, 155, 255, 0.12), rgba(91, 116, 255, 0.35))",
          borderRadius: "50%",
          filter: "blur(90px)",
          transform: "translateX(-50%)",
          opacity: "0.9",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: "980px",
          margin: "0px auto",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "26px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            fontWeight: "500",
            color: "rgb(201, 205, 230)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "6px 14px 6px 6px",
            borderRadius: "999px",
            background: "rgba(16, 18, 42, 0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              background:
                "linear-gradient(100deg, rgb(91, 116, 255), rgb(155, 123, 255))",
              color: "rgb(255, 255, 255)",
              fontSize: "11px",
              fontWeight: "700",
              padding: "3px 9px",
              borderRadius: "999px",
              letterSpacing: "0.02em",
            }}
          >
            NOUVEAU
          </span>{" "}
          L&apos;assistant commercial de votre équipe{" "}
        </span>
        <h1
          style={{
            fontSize: "clamp(46px, 7.6vw, 96px)",
            lineHeight: "1.08",
            letterSpacing: "-0.055em",
            fontWeight: "700",
            textWrap: "balance",
          }}
        >
          Vous vendez.
          <br />
          <span
            style={{
              display: "inline-block",
              color: "rgb(255, 255, 255)",
              background: "rgb(124, 92, 255)",
              padding: "0px 0.14em",
              borderRadius: "0.12em",
              transform: "rotate(-1.5deg)",
            }}
          >
            SalesTime
          </span>{" "}
          s&apos;occupe{" "}
          <span style={{ whiteSpace: "nowrap" }}>
            <LandingV13RotatingWord />
          </span>
        </h1>
        <p
          style={{
            fontSize: "clamp(18px, 1.8vw, 21px)",
            lineHeight: "1.5",
            color: "rgb(154, 159, 192)",
            maxWidth: "640px",
            textWrap: "pretty",
          }}
        >
          Moins de reporting, moins de CRM à remplir, moins de propales à
          préparer. Chaque RDV devient un compte rendu structuré, un coaching
          personnalisé et un mail de suivi, en quelques minutes.
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
          <a
            href="#how"
            style={{
              color: "rgb(242, 243, 250)",
              fontWeight: "600",
              fontSize: "16px",
              padding: "16px 28px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            Voir comment ça marche
          </a>
        </div>
        <span style={{ fontSize: "13px", color: "rgb(107, 112, 150)" }}>
          Pas de carte bancaire · Hébergement UE · Prêt en 2 minutes
        </span>
      </div>
      <LandingV13Mockup />
    </section>
  );
}
