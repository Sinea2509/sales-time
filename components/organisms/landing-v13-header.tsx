import Link from "next/link";
/*
  Reproduction de la landing « Sales Time v13 » de Thomas (3 novembre 2026),
  styles repris tels quels du rendu. Les sections qui montraient des clients
  (bandeau de logos, témoignage chiffré) sont retirées à sa demande.
*/

/** Le bandeau du haut, en pilule. */
export function LandingV13Header() {
  return (
    <header
      style={{
        position: "sticky",
        top: "0px",
        zIndex: "40",
        padding: "14px 16px",
      }}
    >
      <div
        className="gap-2 pl-4 sm:gap-5 sm:pl-5"
        style={{
          maxWidth: "1160px",
          margin: "0px auto",
          paddingTop: "8px",
          paddingRight: "8px",
          paddingBottom: "8px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          background: "rgba(16, 18, 42, 0.72)",
          backdropFilter: "saturate(180%) blur(18px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "999px",
        }}
      >
        <a
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "rgb(242, 243, 250)",
            fontWeight: "700",
            fontSize: "17px",
            letterSpacing: "-0.03em",
          }}
        >
          <span
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, rgb(91, 116, 255), rgb(155, 123, 255) 60%, rgb(198, 155, 255))",
              boxShadow: "rgba(123, 116, 255, 0.6) 0px 0px 18px",
            }}
          />{" "}
          Sales Time{" "}
        </a>
        <nav
          className="hidden lg:flex"
          style={{
            gap: "26px",
            flex: "1 1 0%",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="#features"
            style={{
              color: "rgb(183, 187, 214)",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Fonctionnalités
          </a>
          <a
            href="#roles"
            style={{
              color: "rgb(183, 187, 214)",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Pour qui
          </a>
          <a
            href="#how"
            style={{
              color: "rgb(183, 187, 214)",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Comment ça marche
          </a>
          <a
            href="#faq"
            style={{
              color: "rgb(183, 187, 214)",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            FAQ
          </a>
        </nav>
        {/*
          Sans le menu d'ancres, caché sous 1024 px, ce groupe se cale à droite.
          Sur téléphone, « Connexion » perd un peu de marge pour tenir sur une
          ligne avec le logo.
        */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          <Link
            href="/sign-in"
            className="px-2 sm:px-3.5"
            style={{
              color: "rgb(242, 243, 250)",
              fontSize: "14px",
              fontWeight: "500",
              paddingTop: "10px",
              paddingBottom: "10px",
            }}
          >
            Connexion
          </Link>
          <Link
            href="/sign-up"
            className="px-3.5 sm:px-[18px]"
            style={{
              background: "rgb(242, 243, 250)",
              color: "rgb(7, 8, 26)",
              fontSize: "14px",
              fontWeight: "600",
              paddingTop: "10px",
              paddingBottom: "10px",
              borderRadius: "999px",
            }}
          >
            <span className="sm:hidden">Essayer</span>
            <span className="hidden sm:inline">Essayer gratuitement</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
