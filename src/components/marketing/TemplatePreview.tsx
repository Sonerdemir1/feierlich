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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(250,246,239,0.35) 0%, rgba(250,246,239,0.68) 55%, rgba(250,246,239,0.9) 100%), url(/images/templates/wedding-aisle-classic.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.18em" }}>ANNA</div>
          <div style={{ fontSize: 9, color: "#B2543A", margin: "6px 0" }}>&amp;</div>
          <div style={{ fontWeight: 600, fontSize: 12, letterSpacing: "0.18em" }}>LUKAS</div>
        </div>
      );
    case "mono-editorial":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(250,246,239,0.25) 0%, rgba(250,246,239,0.55) 55%, rgba(250,246,239,0.85) 100%), url(/images/templates/mono-editorial.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 16,
          }}
        >
          <div style={{ width: "100%", height: 2, background: "#B2543A", marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "0.04em", color: "#211C19" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: "100%", height: 2, background: "#B2543A", marginTop: 12 }} />
        </div>
      );
    case "letterpress":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(250,246,239,0.25) 0%, rgba(250,246,239,0.55) 55%, rgba(250,246,239,0.85) 100%), url(/images/templates/letterpress.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "inset 0 0 0 1px #E4D9C8",
          }}
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
              background: "rgba(250,246,239,0.7)",
            }}
          >
            A·L
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#5C5248", marginTop: 12 }}>ANNA &amp; LUKAS</div>
        </div>
      );
    case "botanico":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(243,236,223,0.3) 0%, rgba(243,236,223,0.62) 55%, rgba(243,236,223,0.88) 100%), url(/images/templates/fern-greenery.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#8F4029" }}>
            A &amp; L
          </div>
        </div>
      );
    case "terracotta-bloom":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(178,84,58,0.45) 0%, rgba(178,84,58,0.75) 55%, rgba(178,84,58,0.93) 100%), url(/images/templates/terracotta-bloom.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#FAF6EF" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "olivenzweig":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(237,239,225,0.25) 0%, rgba(237,239,225,0.55) 55%, rgba(237,239,225,0.85) 100%), url(/images/templates/olivenzweig.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#4E5A38" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "roman-script":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(240,217,204,0.3) 0%, rgba(240,217,204,0.62) 55%, rgba(240,217,204,0.88) 100%), url(/images/templates/rose-tulip-bouquet.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(245,225,222,0.25) 0%, rgba(245,225,222,0.55) 55%, rgba(245,225,222,0.85) 100%), url(/images/templates/rosenquarz.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 16,
          }}
        >
          <div style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, border: "1px solid #C98E88" }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#8B4A45" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "liebesbrief":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(243,236,223,0.25) 0%, rgba(243,236,223,0.55) 55%, rgba(243,236,223,0.85) 100%), url(/images/templates/liebesbrief.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(33,28,25,0.45) 0%, rgba(33,28,25,0.72) 55%, rgba(33,28,25,0.92) 100%), url(/images/templates/grand-hall-dramatic.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 16,
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(22,19,15,0.45) 0%, rgba(22,19,15,0.75) 55%, rgba(22,19,15,0.93) 100%), url(/images/templates/onyx.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ width: "100%", height: 1, background: "#F4EEE4", marginBottom: 14 }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#B9975B", marginBottom: 10 }} />
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#F4EEE4" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: "100%", height: 1, background: "#F4EEE4", marginTop: 14 }} />
        </div>
      );
    case "kupferglanz":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(166,81,46,0.45) 0%, rgba(166,81,46,0.75) 55%, rgba(166,81,46,0.93) 100%), url(/images/templates/kupferglanz.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(250,246,239,0.2) 0%, rgba(250,246,239,0.5) 55%, rgba(250,246,239,0.85) 100%), url(/images/templates/oya-lace.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "#7A2E3A" }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#C98E88", marginTop: 8 }}>KINA GECESİ</div>
        </div>
      );
    case "nar-cicegi":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(247,227,217,0.2) 0%, rgba(247,227,217,0.5) 55%, rgba(247,227,217,0.85) 100%), url(/images/templates/nar-cicegi.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#7A2E3A" }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#C9605C", marginTop: 8 }}>KINA GECESİ</div>
        </div>
      );
    case "hochzeit-elegant-gold":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage: "url(/images/templates/hochzeit-elegant-gold/05-card-revealed.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#211C19" }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#B9975B", marginTop: 8 }}>DÜĞÜN</div>
        </div>
      );
    // Drei Düğün-Vorlagen mit echtem Foto (siehe PHOTO_BACKGROUND in
    // gallery-templates.ts) — hatten hier lange keinen eigenen Fall und
    // fielen dadurch auf den generischen "Vorschau folgt"-Platzhalter
    // zurueck, obwohl fuer sie extra Fotos eingekauft wurden.
    case "dugun-foto-elmas":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(250,243,228,0.15) 0%, rgba(58,46,34,0.55) 100%), url(/images/templates/palace-ballroom-gold.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 6, border: "1px solid #C9A22799" }} />
          <CornerMotif color="#C9A227" corner="tl" />
          <CornerMotif color="#C9A227" corner="tr" />
          <CornerMotif color="#C9A227" corner="bl" />
          <CornerMotif color="#C9A227" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#FAF3E4", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#C9A227", marginTop: 10, zIndex: 1 }}>DÜĞÜN</div>
        </div>
      );
    case "dugun-foto-zumrut":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,42,30,0.35) 0%, rgba(11,42,30,0.8) 100%), url(/images/templates/malachite-emerald-gold.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 6, border: "1px solid #D4AF6A99" }} />
          <CornerMotif color="#D4AF6A" corner="tl" />
          <CornerMotif color="#D4AF6A" corner="tr" />
          <CornerMotif color="#D4AF6A" corner="bl" />
          <CornerMotif color="#D4AF6A" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#FAF3E0", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4AF6A", marginTop: 10, zIndex: 1 }}>DÜĞÜN</div>
        </div>
      );
    case "dugun-foto-yakut":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(92,20,32,0.2) 0%, rgba(92,20,32,0.62) 100%), url(/images/templates/red-roses-candlelight.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 6, border: "1px solid #C08A2E99" }} />
          <CornerMotif color="#C08A2E" corner="tl" />
          <CornerMotif color="#C08A2E" corner="tr" />
          <CornerMotif color="#C08A2E" corner="bl" />
          <CornerMotif color="#C08A2E" corner="br" />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 19, color: "#F6ECD9", zIndex: 1 }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#C08A2E", marginTop: 10, zIndex: 1 }}>DÜĞÜN</div>
        </div>
      );
    // Echte "Blanko"-Kartendesigns (Kunde hat die fertigen Bilder
    // bereitgestellt) — kein CSS-Nachbau: Kartenbild als Hintergrund,
    // Brautpaar-Text mittig darueber. Textfarbe je nach Kartenmotiv hell
    // (dunkle Karten) oder dunkel (helle/Elfenbein-Karten).
    case "dugun-01":
    case "dugun-02":
    case "dugun-07":
    case "dugun-11":
    case "dugun-12":
    case "dugun-14":
    case "dugun-15":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage: `url(/images/templates/dugun-blanko/${layoutKey}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#2E241A" }}>
            Ayşe &amp; Emre
          </div>
        </div>
      );
    case "dugun-05":
    case "dugun-06":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage: `url(/images/templates/dugun-blanko/${layoutKey}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#3B1620" }}>
            Ayşe &amp; Emre
          </div>
        </div>
      );
    case "dugun-04":
    case "dugun-08":
    case "dugun-09":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage: `url(/images/templates/dugun-blanko/${layoutKey}.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#FAF3E0" }}>
            Ayşe &amp; Emre
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(251,234,238,0.2) 0%, rgba(251,234,238,0.5) 55%, rgba(251,234,238,0.85) 100%), url(/images/templates/soz-guemuesue.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#5C1A2E" }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#D4A574", marginTop: 8 }}>NİŞAN</div>
        </div>
      );
    case "sehzade-mavisi":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(14,47,90,0.55) 0%, rgba(14,47,90,0.78) 55%, rgba(14,47,90,0.94) 100%), url(/images/templates/iznik-floral.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(234,241,248,0.2) 0%, rgba(234,241,248,0.5) 55%, rgba(234,241,248,0.85) 100%), url(/images/templates/masmavi.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, border: "1px solid #8FA8C9" }} />
          <NazarBoncugu x={12} y={116} size={22} opacity={0.85} />
          <NazarBoncugu x={126} y={12} size={18} opacity={0.7} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#1B3A5C", zIndex: 1, position: "relative" }}>
            Kaan
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#1B3A5C", marginTop: 8, zIndex: 1, position: "relative" }}>
            SÜNNET
          </div>
        </div>
      );
    case "gul-bahcesi":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(251,239,234,0.2) 0%, rgba(251,239,234,0.5) 55%, rgba(251,239,234,0.85) 100%), url(/images/templates/gul-bahcesi.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#6B2737" }}>
            Ayşe &amp; Emre
          </div>
          <div style={{ fontSize: 9, letterSpacing: "0.14em", color: "#E8A6B0", marginTop: 8 }}>NİŞAN</div>
        </div>
      );
    case "papier-weiss":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.6) 55%, rgba(255,255,255,0.88) 100%), url(/images/templates/papier-weiss.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ width: 24, height: 1, background: "#7C7267", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 11, letterSpacing: "0.16em", color: "#211C19" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: 24, height: 1, background: "#7C7267", margin: "10px auto 0" }} />
        </div>
      );
    case "sandstein":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(239,231,216,0.25) 0%, rgba(239,231,216,0.55) 55%, rgba(239,231,216,0.85) 100%), url(/images/templates/sandstein.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 16,
          }}
        >
          <div style={{ width: "100%", height: 2, background: "#A6875B", marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 11.5, letterSpacing: "0.04em", color: "#3A332C" }}>ANNA &amp; LUKAS</div>
          <div style={{ width: "100%", height: 2, background: "#A6875B", marginTop: 12 }} />
        </div>
      );
    case "eukalyptus":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(238,242,233,0.25) 0%, rgba(238,242,233,0.55) 55%, rgba(238,242,233,0.85) 100%), url(/images/templates/eukalyptus.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#2F4739" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "wildblume":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(251,241,228,0.25) 0%, rgba(251,241,228,0.55) 55%, rgba(251,241,228,0.85) 100%), url(/images/templates/wildblume.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#5C3A21" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "pfingstrose":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(251,238,241,0.25) 0%, rgba(251,238,241,0.55) 55%, rgba(251,238,241,0.85) 100%), url(/images/templates/pfingstrose.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, color: "#7A3B4A" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "champagner":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(250,243,230,0.25) 0%, rgba(250,243,230,0.55) 55%, rgba(250,243,230,0.85) 100%), url(/images/templates/champagner.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 16,
          }}
        >
          <div style={{ position: "absolute", top: 9, left: 9, right: 9, bottom: 9, border: "1px solid #D9C8A8" }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#6B5842" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "mitternacht":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(16,19,31,0.45) 0%, rgba(16,19,31,0.75) 55%, rgba(16,19,31,0.93) 100%), url(/images/templates/mitternacht.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "#EDEFF5" }}>
            Anna &amp; Lukas
          </div>
        </div>
      );
    case "bordeaux":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(43,16,20,0.45) 0%, rgba(43,16,20,0.75) 55%, rgba(43,16,20,0.93) 100%), url(/images/templates/bordeaux.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9605C", marginBottom: 10 }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#F4E9E6" }}>
            Anna &amp; Lukas
          </div>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9605C", marginTop: 10 }} />
        </div>
      );
    case "konfetti":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,244,227,0.25) 0%, rgba(255,244,227,0.55) 55%, rgba(255,244,227,0.85) 100%), url(/images/templates/party-balloons.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18, color: "#3A2E4A" }}>
            Mia wird 5
          </div>
        </div>
      );
    case "zuckerwatte":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(251,239,246,0.2) 0%, rgba(251,239,246,0.5) 55%, rgba(251,239,246,0.82) 100%), url(/images/templates/zuckerwatte.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(234,246,238,0.15) 0%, rgba(234,246,238,0.45) 55%, rgba(234,246,238,0.8) 100%), url(/images/templates/pastellwiese.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(22,35,59,0.45) 0%, rgba(22,35,59,0.75) 55%, rgba(22,35,59,0.94) 100%), url(/images/templates/modern-lounge-warm.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: 16,
          }}
        >
          <div style={{ width: "100%", height: 2, background: "#2F6FED", marginBottom: 12 }} />
          <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", color: "#FAFBFF" }}>JAHRESEMPFANG 2026</div>
          <div style={{ width: "100%", height: 2, background: "#2F6FED", marginTop: 12 }} />
        </div>
      );
    case "graphit":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(30,35,40,0.45) 0%, rgba(30,35,40,0.75) 55%, rgba(30,35,40,0.93) 100%), url(/images/templates/graphit.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{ width: "100%", height: 1, background: "#9AA5B1", marginBottom: 14 }} />
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#FFFFFF" }}>JAHRESEMPFANG 2026</div>
          <div style={{ width: "100%", height: 1, background: "#9AA5B1", marginTop: 14 }} />
        </div>
      );
    case "minz-corporate":
      return (
        <div
          className="tpl-prev"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(240,247,244,0.25) 0%, rgba(240,247,244,0.55) 55%, rgba(240,247,244,0.85) 100%), url(/images/templates/minz-corporate.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
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
