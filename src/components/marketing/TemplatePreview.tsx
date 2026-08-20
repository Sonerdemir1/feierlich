// Dekorative Vorschau-Kachel je Template. `layoutKey` kommt aus der DB
// (Template-Tabelle) — neue layoutKeys brauchen einen neuen Fall hier,
// alles andere (Name, Kategorie, Preis, Verfuegbarkeit) ist datengetrieben.

export function TemplatePreview({ layoutKey }: { layoutKey: string }) {
  switch (layoutKey) {
    case "minimal-ivory":
      return (
        <div className="tpl-prev" style={{ background: "#FAF6EF" }}>
          <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.18em" }}>ANNA</div>
          <div style={{ fontSize: 9, color: "#B2543A", margin: "6px 0" }}>&amp;</div>
          <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.18em" }}>LUKAS</div>
        </div>
      );
    case "mono-editorial":
      return (
        <div className="tpl-prev" style={{ background: "#FAF6EF", padding: 16 }}>
          <div style={{ width: "100%", height: 2, background: "#B2543A", marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "0.04em" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: "100%", height: 2, background: "#B2543A", marginTop: 12 }} />
        </div>
      );
    case "letterpress":
      return (
        <div
          className="tpl-prev"
          style={{ background: "#FAF6EF", boxShadow: "inset 0 0 0 1px #E4D9C8, inset 0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              border: "1px solid #211C19",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 13,
              color: "#211C19",
            }}
          >
            A·L
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#5C5248", marginTop: 12 }}>ANNA &amp; LUKAS</div>
        </div>
      );
    case "botanico":
      return (
        <div className="tpl-prev" style={{ background: "#F3ECDF" }}>
          <svg
            width="30"
            height="30"
            viewBox="0 0 34 34"
            style={{ position: "absolute", top: 10, left: 10 }}
            fill="none"
            stroke="#8F9B6E"
            strokeWidth="1.3"
          >
            <path d="M2 32C2 20 10 10 24 6" />
            <path d="M8 22C11 22 14 19 14 15" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#8F4029" }}>
            A &amp; L
          </div>
        </div>
      );
    case "terracotta-bloom":
      return (
        <div className="tpl-prev" style={{ background: "#B2543A" }}>
          <svg
            width="52"
            height="52"
            viewBox="0 0 60 60"
            style={{ position: "absolute", top: -10, right: -10, opacity: 0.5 }}
            fill="none"
            stroke="#F0D9CC"
            strokeWidth="1.2"
          >
            <circle cx="30" cy="30" r="6" />
            <circle cx="30" cy="16" r="6" />
            <circle cx="42" cy="24" r="6" />
            <circle cx="18" cy="24" r="6" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#FAF6EF" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "olivenzweig":
      return (
        <div className="tpl-prev" style={{ background: "#EDEFE1" }}>
          <svg
            width="140"
            height="70"
            viewBox="0 0 140 70"
            style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.6 }}
            fill="none"
            stroke="#7C8560"
            strokeWidth="1.2"
          >
            <path d="M0 60 Q40 40 80 45 T140 25" />
            <ellipse cx="30" cy="49" rx="6" ry="3" transform="rotate(-20 30 49)" />
            <ellipse cx="60" cy="43" rx="6" ry="3" transform="rotate(-10 60 43)" />
            <ellipse cx="95" cy="33" rx="6" ry="3" transform="rotate(-25 95 33)" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#4E5A38" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "roman-script":
      return (
        <div className="tpl-prev" style={{ background: "#F0D9CC" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 21,
              lineHeight: 1.15,
              color: "#6B2F1A",
            }}
          >
            Anna
            <br />
            &amp; Lukas
          </div>
        </div>
      );
    case "rosenquarz":
      return (
        <div className="tpl-prev" style={{ background: "#F5E1DE", padding: 16 }}>
          <div style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, border: "1px solid #C98E88" }} />
          <div style={{ position: "absolute", top: 13, left: 13, right: 13, bottom: 13, border: "1px solid #C98E88" }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#8B4A45" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "liebesbrief":
      return (
        <div className="tpl-prev" style={{ background: "#F3ECDF" }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "#B2543A",
              color: "#FAF6EF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontFamily: "var(--font-display)",
              margin: "0 auto 10px",
            }}
          >
            A&amp;L
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "#6B4A32" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "gold-line":
      return (
        <div className="tpl-prev" style={{ background: "#211C19", padding: 16 }}>
          <div
            style={{
              border: "1px solid #B9975B",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#FAF6EF" }}>Anna &amp; Lukas</div>
          </div>
        </div>
      );
    case "onyx":
      return (
        <div className="tpl-prev" style={{ background: "#16130F" }}>
          <div style={{ width: "100%", height: 1, background: "#F4EEE4", marginBottom: 14 }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#B9975B", marginBottom: 10 }} />
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#F4EEE4" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: "100%", height: 1, background: "#F4EEE4", marginTop: 14 }} />
        </div>
      );
    case "kupferglanz":
      return (
        <div className="tpl-prev" style={{ background: "#A6512E" }}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{ position: "absolute", top: 10, left: 10 }}
            fill="#A6512E"
            stroke="#F0D9CC"
            strokeWidth="1"
          >
            <rect x="1" y="1" width="8" height="8" transform="rotate(45 5 5)" />
          </svg>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            style={{ position: "absolute", bottom: 10, right: 10 }}
            fill="#A6512E"
            stroke="#F0D9CC"
            strokeWidth="1"
          >
            <rect x="1" y="1" width="8" height="8" transform="rotate(45 5 5)" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#FAF6EF" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    default:
      return (
        <div className="tpl-prev" style={{ background: "#F3ECDF" }}>
          <div style={{ fontSize: 12, color: "#8A7F6E" }}>Vorschau folgt</div>
        </div>
      );
  }
}
