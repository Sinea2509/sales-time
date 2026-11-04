import Link from "next/link";
/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Le pied de page. */
export function LandingV13Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgb(22, 26, 54)" }}>
      <div
        style={{
          maxWidth: "1160px",
          margin: "0px auto",
          padding: "48px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "32px",
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: "700",
              fontSize: "17px",
              letterSpacing: "-0.03em",
            }}
          >
            <span
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, rgb(91, 116, 255), rgb(155, 123, 255))",
              }}
            />
            Sales Time
          </span>
          <span style={{ color: "rgb(107, 112, 150)" }}>
            L&apos;assistant commercial de votre équipe.
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span
            style={{
              fontFamily: '"Geist Mono", monospace',
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "rgb(107, 112, 150)",
            }}
          >
            PRODUIT
          </span>
          <a href="#features" style={{ color: "rgb(183, 187, 214)" }}>
            Fonctionnalités
          </a>
          <Link href="/company/plan" style={{ color: "rgb(183, 187, 214)" }}>
            Plan produit
          </Link>
          <a href="#faq" style={{ color: "rgb(183, 187, 214)" }}>
            FAQ
          </a>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span
            style={{
              fontFamily: '"Geist Mono", monospace',
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "rgb(107, 112, 150)",
            }}
          >
            COMPTE
          </span>
          <Link href="/sign-in" style={{ color: "rgb(183, 187, 214)" }}>
            Connexion
          </Link>
          <Link href="/sign-up" style={{ color: "rgb(183, 187, 214)" }}>
            Inscription
          </Link>
        </div>
      </div>
      <div
        style={{
          maxWidth: "1160px",
          margin: "0px auto",
          padding: "20px 24px 32px",
          borderTop: "1px solid rgb(22, 26, 54)",
          fontSize: "13px",
          color: "rgb(107, 112, 150)",
        }}
      >
        © 2026 Sales Time. Tous droits réservés.
      </div>
    </footer>
  );
}
