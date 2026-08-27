// Dekorative Vorschau-Kachel je Template. `layoutKey` kommt aus der DB
// (Template-Tabelle) — neue layoutKeys brauchen einen neuen Fall hier,
// alles andere (Name, Kategorie, Preis, Verfuegbarkeit) ist datengetrieben.

// Wiederverwendbares Eckornament (gefuellte Paisley-Tropfenform, kein
// duenner Strich) fuer die "kitschigen" tuerkischen Vorlagen — gefuellte
// Flaechen lesen sich als echte Grafik statt als Skizze.
export function CornerMotif({ color, corner }: { color: string; corner: "tl" | "tr" | "bl" | "br" }) {
  const pos: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 8 },
    tr: { top: 8, right: 8, transform: "scaleX(-1)" },
    bl: { bottom: 8, left: 8, transform: "scaleY(-1)" },
    br: { bottom: 8, right: 8, transform: "scale(-1,-1)" },
  };
  return (
    <svg width="32" height="32" viewBox="0 0 34 34" style={{ position: "absolute", ...pos[corner] }}>
      <path
        d="M3 30 C0 18 3 3 20 2 C23 2 24 5 21 6 C11 9 6 17 9 25 C11 30 8 32 3 30 Z"
        fill={color}
        opacity="0.92"
      />
      <circle cx="19.5" cy="5" r="1.7" fill={color} />
    </svg>
  );
}

export function DotScatter({ color, seed = 0 }: { color: string; seed?: number }) {
  const sets = [
    [
      [14, 16, 3.2, 0.55],
      [34, 12, 2.4, 0.4],
      [120, 20, 2.8, 0.5],
      [140, 18, 2, 0.35],
      [20, 132, 2.6, 0.45],
      [128, 130, 3, 0.5],
    ],
    [
      [26, 24, 2.6, 0.5],
      [130, 14, 2.2, 0.4],
      [146, 100, 2.8, 0.45],
      [12, 108, 2.4, 0.4],
      [80, 22, 2, 0.35],
      [78, 138, 2.6, 0.45],
    ],
  ];
  const set = sets[seed % sets.length];
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: "absolute", inset: 0 }} fill={color}>
      {set.map(([cx, cy, r, o], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} opacity={o} />
      ))}
    </svg>
  );
}

// Nazar Boncuğu (Blaues Auge) — saekulares, sehr verbreitetes tuerkisches
// Schutz-/Glueckssymbol, konzentrische gefuellte Kreise. Fuer Sünnet
// explizit gewuenscht statt einer schlichten Flaechenfarbe.
export function NazarBoncugu({ size, x, y, opacity = 1 }: { size: number; x: number; y: number; opacity?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ position: "absolute", top: y, left: x, opacity }}
    >
      <circle cx="20" cy="20" r="19" fill="#16305C" />
      <circle cx="20" cy="20" r="15" fill="#F4F4F0" />
      <circle cx="20" cy="20" r="11" fill="#2F6FED" />
      <circle cx="20" cy="20" r="6.5" fill="#F4F4F0" />
      <circle cx="20" cy="20" r="3.2" fill="#16305C" />
    </svg>
  );
}

export function NazarScatter() {
  const set: [number, number, number, number][] = [
    [10, 14, 20, 0.9],
    [128, 10, 16, 0.75],
    [16, 118, 15, 0.7],
    [124, 126, 22, 0.85],
    [66, 8, 12, 0.55],
  ];
  return (
    <>
      {set.map(([x, y, size, opacity], i) => (
        <NazarBoncugu key={i} x={x} y={y} size={size} opacity={opacity} />
      ))}
    </>
  );
}

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
    case "kina-kirmizi":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(122,20,40,0.55) 0%, rgba(122,20,40,0.78) 55%, rgba(122,20,40,0.94) 100%), url(/images/templates/iznik-floral.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 6, border: "1px solid #D4AF3799" }} />
          <CornerMotif color="#D4AF37" corner="tl" />
          <CornerMotif color="#D4AF37" corner="tr" />
          <CornerMotif color="#D4AF37" corner="bl" />
          <CornerMotif color="#D4AF37" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#F4D77A", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF37", marginTop: 10, zIndex: 1 }}>
            KINA GECESİ
          </div>
        </div>
      );
    case "oya-lace":
      return (
        <div className="tpl-prev" style={{ background: "#FAF6EF" }}>
          <svg width="140" height="14" viewBox="0 0 140 14" style={{ position: "absolute", top: 10 }} fill="none" stroke="#C98E88" strokeWidth="1">
            {[8, 24, 40, 56, 72, 88, 104, 120, 136].map((x) => (
              <circle key={x} cx={x} cy={7} r={5} />
            ))}
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "#7A2E3A" }}>
            Ayşe &amp; Emre
          </div>
          <svg width="140" height="14" viewBox="0 0 140 14" style={{ position: "absolute", bottom: 10 }} fill="none" stroke="#C98E88" strokeWidth="1">
            {[8, 24, 40, 56, 72, 88, 104, 120, 136].map((x) => (
              <circle key={x} cx={x} cy={7} r={5} />
            ))}
          </svg>
        </div>
      );
    case "ottoman-line":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(27,58,62,0.55) 0%, rgba(27,58,62,0.78) 55%, rgba(27,58,62,0.94) 100%), url(/images/templates/iznik-floral.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 7, border: "1px solid #D4AF3799" }} />
          <CornerMotif color="#D4AF37" corner="tl" />
          <CornerMotif color="#D4AF37" corner="tr" />
          <CornerMotif color="#D4AF37" corner="bl" />
          <CornerMotif color="#D4AF37" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#FAF6EF", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF37", marginTop: 8, zIndex: 1 }}>
            DÜĞÜN
          </div>
        </div>
      );
    case "nar-cicegi":
      return (
        <div className="tpl-prev" style={{ background: "#F7E3D9" }}>
          <svg width="30" height="34" viewBox="0 0 30 34" style={{ marginBottom: 10 }} fill="none" stroke="#C9605C" strokeWidth="1.3">
            <path d="M15 6C9 6 5 11 5 18c0 7 4.5 11 10 11s10-4 10-11c0-7-4-12-10-12z" />
            <path d="M11 4l2 3M15 3v4M19 4l-2 3" />
            <circle cx="11" cy="17" r="1.1" fill="#C9605C" stroke="none" />
            <circle cx="15" cy="21" r="1.1" fill="#C9605C" stroke="none" />
            <circle cx="18" cy="16" r="1.1" fill="#C9605C" stroke="none" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#7A2E3A" }}>
            Ayşe &amp; Emre
          </div>
        </div>
      );
    case "altin-sedef":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(92,15,31,0.5) 0%, rgba(92,15,31,0.72) 55%, rgba(92,15,31,0.92) 100%), url(/images/templates/bosphorus-night.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: "2px solid #E3B23C" }} />
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, bottom: 12, border: "1px solid #E3B23C" }} />
          <CornerMotif color="#E3B23C" corner="tl" />
          <CornerMotif color="#E3B23C" corner="tr" />
          <CornerMotif color="#E3B23C" corner="bl" />
          <CornerMotif color="#E3B23C" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#FAF6EF", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#E3B23C", marginTop: 8, zIndex: 1 }}>
            DÜĞÜN
          </div>
        </div>
      );
    case "safir-davet":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,36,71,0.55) 0%, rgba(11,36,71,0.78) 55%, rgba(11,36,71,0.94) 100%), url(/images/templates/iznik-floral.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: "2px solid #D4AF37" }} />
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, bottom: 12, border: "1px solid #D4AF37" }} />
          <CornerMotif color="#D4AF37" corner="tl" />
          <CornerMotif color="#D4AF37" corner="tr" />
          <CornerMotif color="#D4AF37" corner="bl" />
          <CornerMotif color="#D4AF37" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#FAF6EF", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF37", marginTop: 8, zIndex: 1 }}>
            DÜĞÜN
          </div>
        </div>
      );
    case "kraliyet-moru":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(46,26,71,0.55) 0%, rgba(46,26,71,0.78) 55%, rgba(46,26,71,0.94) 100%), url(/images/templates/iznik-floral.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 7, border: "1px solid #D4AF3799" }} />
          <CornerMotif color="#D4AF37" corner="tl" />
          <CornerMotif color="#D4AF37" corner="tr" />
          <CornerMotif color="#D4AF37" corner="bl" />
          <CornerMotif color="#D4AF37" corner="br" />
          <svg width="60" height="24" viewBox="0 0 60 24" style={{ position: "absolute", top: 26, zIndex: 1 }} fill="none" stroke="#D4AF37" strokeWidth="1">
            <path d="M2 20 Q15 2 30 12 Q45 2 58 20" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#F4EEE4", marginTop: 20, zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF37", marginTop: 8, zIndex: 1 }}>NİŞAN</div>
        </div>
      );
    case "soz-guemuesue":
      return (
        <div className="tpl-prev" style={{ background: "#FBEAEE" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ marginBottom: 8 }} fill="none" stroke="#D4A574" strokeWidth="1.4">
            <path d="M20 4 L36 20 L20 36 L4 20 Z" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#5C1A2E" }}>
            Ayşe &amp; Emre
          </div>
        </div>
      );
    case "zuemruet":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(15,61,46,0.55) 0%, rgba(15,61,46,0.78) 55%, rgba(15,61,46,0.94) 100%), url(/images/templates/iznik-floral.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 9, border: "1px solid #D4AF3799" }} />
          <CornerMotif color="#D4AF37" corner="tl" />
          <CornerMotif color="#D4AF37" corner="tr" />
          <CornerMotif color="#D4AF37" corner="bl" />
          <CornerMotif color="#D4AF37" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#FAF6EF", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF37", marginTop: 8, zIndex: 1 }}>
            DÜĞÜN
          </div>
        </div>
      );
    case "sehzade-mavisi":
      return (
        <div className="tpl-prev" style={{ background: "#0E2F5A" }}>
          <div style={{ position: "absolute", inset: 7, border: "1px solid #D4AF3799" }} />
          <NazarScatter />
          <CornerMotif color="#D4AF37" corner="tl" />
          <CornerMotif color="#D4AF37" corner="tr" />
          <CornerMotif color="#D4AF37" corner="bl" />
          <CornerMotif color="#D4AF37" corner="br" />
          <svg width="32" height="24" viewBox="0 0 32 24" style={{ marginBottom: 8, zIndex: 1, position: "relative" }} fill="none" stroke="#D4AF37" strokeWidth="1.3">
            <path d="M2 20 L2 11 L8 16 L16 6 L24 16 L30 11 L30 20 Z" />
            <circle cx="16" cy="4" r="1.5" fill="#D4AF37" stroke="none" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#FAF6EF", zIndex: 1, position: "relative" }}>
            Kaan
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF37", marginTop: 8, zIndex: 1, position: "relative" }}>
            SÜNNET
          </div>
        </div>
      );
    case "masmavi":
      return (
        <div className="tpl-prev" style={{ background: "#EAF1F8" }}>
          <div style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, border: "1px solid #8FA8C9" }} />
          <NazarBoncugu x={12} y={116} size={22} opacity={0.85} />
          <NazarBoncugu x={126} y={12} size={18} opacity={0.7} />
          <CornerMotif color="#8FA8C9" corner="tl" />
          <CornerMotif color="#8FA8C9" corner="br" />
          <svg width="22" height="17" viewBox="0 0 32 24" style={{ marginBottom: 8, zIndex: 1, position: "relative" }} fill="none" stroke="#1B3A5C" strokeWidth="1.3">
            <path d="M2 20 L2 11 L8 16 L16 6 L24 16 L30 11 L30 20 Z" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#1B3A5C", zIndex: 1, position: "relative" }}>
            Kaan
          </div>
        </div>
      );
    case "gul-bahcesi":
      return (
        <div className="tpl-prev" style={{ background: "#FBEFEA" }}>
          <svg width="30" height="30" viewBox="0 0 30 30" style={{ marginBottom: 8 }} fill="none" stroke="#E8A6B0" strokeWidth="1.3">
            <circle cx="15" cy="15" r="12" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#6B2737" }}>
            Ayşe &amp; Emre
          </div>
        </div>
      );
    case "papier-weiss":
      return (
        <div className="tpl-prev" style={{ background: "#FFFFFF" }}>
          <div style={{ width: 24, height: 1, background: "#7C7267", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "#211C19" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: 24, height: 1, background: "#7C7267", margin: "10px auto 0" }} />
        </div>
      );
    case "sandstein":
      return (
        <div className="tpl-prev" style={{ background: "#EFE7D8", padding: 16 }}>
          <div style={{ width: "100%", height: 2, background: "#A6875B", marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "0.04em", color: "#3A332C" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: "100%", height: 2, background: "#A6875B", marginTop: 12 }} />
        </div>
      );
    case "eukalyptus":
      return (
        <div className="tpl-prev" style={{ background: "#EEF2E9" }}>
          <svg width="120" height="60" viewBox="0 0 120 60" style={{ position: "absolute", top: 6, right: 6, opacity: 0.6 }} fill="#6B8F71" stroke="none">
            <ellipse cx="14" cy="14" rx="9" ry="5" transform="rotate(30 14 14)" />
            <ellipse cx="34" cy="10" rx="9" ry="5" transform="rotate(10 34 10)" />
            <ellipse cx="54" cy="16" rx="9" ry="5" transform="rotate(-15 54 16)" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#2F4739" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "wildblume":
      return (
        <div className="tpl-prev" style={{ background: "#FBF1E4" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: "absolute", top: 12, left: 14 }} fill="#C97B4A">
            <circle cx="8" cy="8" r="3" />
            <circle cx="8" cy="2" r="2.4" />
            <circle cx="14" cy="8" r="2.4" />
            <circle cx="8" cy="14" r="2.4" />
            <circle cx="2" cy="8" r="2.4" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#5C3A21" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "pfingstrose":
      return (
        <div className="tpl-prev" style={{ background: "#FBEEF1" }}>
          <svg width="34" height="34" viewBox="0 0 34 34" style={{ marginBottom: 8 }} fill="none" stroke="#E4A0AE" strokeWidth="1.3">
            <circle cx="17" cy="17" r="14" />
            <circle cx="17" cy="17" r="8" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#7A3B4A" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "champagner":
      return (
        <div className="tpl-prev" style={{ background: "#FAF3E6", padding: 16 }}>
          <div style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, border: "1px solid #D9C8A8" }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#6B5842" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "mitternacht":
      return (
        <div className="tpl-prev" style={{ background: "#10131F" }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ position: "absolute", top: -14, right: -14, opacity: 0.5 }} fill="none" stroke="#7C93C4" strokeWidth="1">
            <circle cx="30" cy="30" r="18" />
          </svg>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "#EDEFF5" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "bordeaux":
      return (
        <div className="tpl-prev" style={{ background: "#2B1014" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9605C", marginBottom: 10 }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#F4E9E6" }}>
            Anna &amp; Lukas
          </div>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9605C", marginTop: 10 }} />
        </div>
      );
    case "konfetti":
      return (
        <div className="tpl-prev" style={{ background: "linear-gradient(135deg, #FFD23F 0%, #FF6B5B 100%)" }}>
          {[
            ["8%", "10%", "circle", "#4ECDC4", 12],
            ["88%", "14%", "rect", "#3A2E4A", 10],
            ["14%", "82%", "rect", "#FFFFFF", 9],
            ["86%", "80%", "circle", "#3A2E4A", 11],
            ["46%", "8%", "tri", "#FFFFFF", 12],
            ["10%", "46%", "circle", "#3A2E4A", 8],
            ["92%", "48%", "rect", "#4ECDC4", 8],
            ["50%", "90%", "circle", "#FFFFFF", 10],
            ["28%", "20%", "rect", "#3A2E4A", 7],
            ["68%", "84%", "tri", "#4ECDC4", 10],
          ].map(([left, top, shape, color, size], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: left as string,
                top: top as string,
                width: size as number,
                height: size as number,
                borderRadius: shape === "circle" ? "50%" : shape === "rect" ? 2 : 0,
                background: shape === "tri" ? "transparent" : (color as string),
                borderLeft: shape === "tri" ? `${(size as number) / 2}px solid transparent` : undefined,
                borderRight: shape === "tri" ? `${(size as number) / 2}px solid transparent` : undefined,
                borderBottom: shape === "tri" ? `${size}px solid ${color}` : undefined,
                transform: shape === "rect" ? `rotate(${i * 23}deg)` : undefined,
              }}
            />
          ))}
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 20,
              color: "#3A2E4A",
              transform: "rotate(-3deg)",
              textShadow: "2px 2px 0 rgba(255,255,255,0.6)",
            }}
          >
            Mia wird 5
          </div>
        </div>
      );
    case "zuckerwatte":
      return (
        <div className="tpl-prev" style={{ background: "linear-gradient(160deg, #FFD1E8 0%, #C9A6FF 100%)" }}>
          <svg width="90" height="76" viewBox="0 0 90 76" style={{ marginBottom: 8 }}>
            <circle cx="26" cy="26" r="17" fill="#FFB6D9" opacity="0.9" />
            <circle cx="46" cy="16" r="15" fill="#FFFFFF" opacity="0.85" />
            <circle cx="60" cy="28" r="16" fill="#FFB6D9" opacity="0.9" />
            <circle cx="40" cy="32" r="14" fill="#FFFFFF" opacity="0.8" />
            <path d="M45 40 L45 68" stroke="#B98BE0" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 20,
              color: "#6B2E82",
              transform: "rotate(2deg)",
            }}
          >
            Mia wird 5
          </div>
        </div>
      );
    case "pastellwiese":
      return (
        <div className="tpl-prev" style={{ background: "linear-gradient(180deg, #BEE7F7 0%, #EAF6EE 62%)" }}>
          <svg width="26" height="26" viewBox="0 0 26 26" style={{ position: "absolute", top: 12, right: 14 }}>
            <circle cx="13" cy="13" r="7" fill="#FFD23F" />
            {[0, 45, 90, 135].map((r) => (
              <rect key={r} x="12" y="0" width="2" height="7" fill="#FFD23F" transform={`rotate(${r} 13 13)`} />
            ))}
          </svg>
          <svg width="160" height="40" viewBox="0 0 160 40" style={{ position: "absolute", bottom: 0, left: 0 }}>
            <rect x="0" y="28" width="160" height="12" fill="#7FC490" />
            {[
              [16, "#FF7A9C"],
              [42, "#FFD23F"],
              [70, "#FF9F5B"],
              [98, "#FFFFFF"],
              [126, "#FF7A9C"],
              [148, "#FFD23F"],
            ].map(([cx, color], i) => (
              <g key={i} transform={`translate(${cx}, 22)`}>
                {[0, 72, 144, 216, 288].map((r) => (
                  <ellipse key={r} cx="0" cy="-5" rx="3" ry="5" fill={color as string} transform={`rotate(${r})`} />
                ))}
                <circle cx="0" cy="0" r="2.5" fill="#6B4A2E" />
              </g>
            ))}
          </svg>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 20,
              color: "#2E5B3F",
              marginTop: -6,
            }}
          >
            Mia wird 5
          </div>
        </div>
      );
    case "klarblau":
      return (
        <div className="tpl-prev" style={{ background: "#F4F7FC", padding: 16 }}>
          <div style={{ width: "100%", height: 2, background: "#2F6FED", marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", color: "#16233B" }}>JAHRESEMPFANG 2026</div>
          <div style={{ width: "100%", height: 2, background: "#2F6FED", marginTop: 12 }} />
        </div>
      );
    case "graphit":
      return (
        <div className="tpl-prev" style={{ background: "#1E2328" }}>
          <div style={{ width: "100%", height: 1, background: "#9AA5B1", marginBottom: 14 }} />
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#FFFFFF" }}>JAHRESEMPFANG 2026</div>
          <div style={{ width: "100%", height: 1, background: "#9AA5B1", marginTop: 14 }} />
        </div>
      );
    case "minz-corporate":
      return (
        <div className="tpl-prev" style={{ background: "#F0F7F4" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#2E9E7B", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "#1D2B28" }}>JAHRESEMPFANG 2026</div>
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
