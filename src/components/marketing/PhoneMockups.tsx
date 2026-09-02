// Statische Illustrationen der Gaeste-/Teilen-/Galerie-Ansichten fuer
// die Marketing-Startseite. Zeigen bewusst Beispieldaten ("Anna & Lukas"),
// keine echten Kunden-Events.

export function GuestPagePreview() {
  return (
    <div style={{ width: "100%", fontFamily: "var(--font-body)", color: "#2A2420" }}>
      <section
        style={{
          background: "#F3ECDF",
          padding: "44px 24px 34px",
          textAlign: "center",
          borderBottom: "1px solid #E4D9C8",
        }}
      >
        <div style={{ fontSize: 9.5, letterSpacing: "0.18em", color: "#B2543A", marginBottom: 14 }}>WIR HEIRATEN</div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 31, color: "#8F4029" }}>
          Anna &amp; Lukas
        </div>
        <div style={{ width: 26, height: 1, background: "#B9975B", margin: "14px auto" }} />
        <div style={{ fontSize: 12, letterSpacing: "0.06em", color: "#5C5248" }}>14. Juni 2026 · Schloss Ehrenfels</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
          {[
            ["128", "TAGE"],
            ["14", "STD"],
            ["32", "MIN"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{n}</div>
              <div style={{ fontSize: 8.5, letterSpacing: "0.08em", color: "#8A7F6E" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "30px 24px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>
          Ort &amp; Anfahrt
        </div>
        <div style={{ border: "1px solid #E4D9C8", overflow: "hidden" }}>
          <div style={{ height: 100, background: "#E8E0D2", position: "relative" }}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="#B2543A"
              style={{ position: "absolute", top: "44%", left: "48%", transform: "translate(-50%, -100%)" }}
            >
              <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
          </div>
          <div style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Schloss Ehrenfels</div>
              <div style={{ fontSize: 11, color: "#5C5248" }}>Rüdesheimer Str. 1</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#8F4029" }}>Route ›</div>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 24px 30px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Ablauf</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            ["15:00", "Trauung"],
            ["18:00", "Abendessen"],
            ["20:00", "Party & Tanz"],
          ].map(([time, label], i, arr) => (
            <div key={label} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#B2543A" }} />
                {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: "#E4D9C8", margin: "4px 0" }} />}
              </div>
              <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {time} · {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "26px 24px 40px", background: "#F3ECDF", borderTop: "1px solid #E4D9C8" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
          Zusagen
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <input
            placeholder="Euer Name"
            readOnly
            style={{ padding: "11px 12px", border: "1px solid #D8CBB5", background: "#FAF6EF", fontSize: 12.5 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 0",
                border: "1.5px solid #211C19",
                background: "#211C19",
                color: "#FAF6EF",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Ich komme
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px 0",
                border: "1px solid #D8CBB5",
                color: "#5C5248",
                fontSize: 12,
              }}
            >
              Leider nicht
            </div>
          </div>
          <button
            type="button"
            style={{
              padding: 13,
              background: "#B2543A",
              color: "#FAF6EF",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            Zusage senden
          </button>
        </div>
      </section>
    </div>
  );
}

export function SharePreview() {
  return (
    <div style={{ width: "100%", fontFamily: "var(--font-body)", color: "#2A2420" }}>
      <header style={{ padding: "22px 22px 16px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, color: "#211C19" }}>
          Teilen &amp; drucken
        </div>
      </header>
      <section style={{ padding: "2px 22px 24px" }}>
        <div style={{ border: "1px solid #E4D9C8", background: "#F3ECDF", padding: "24px 20px", textAlign: "center" }}>
          <div
            style={{
              width: 100,
              height: 100,
              background: "#FAF6EF",
              border: "1px solid #E4D9C8",
              margin: "0 auto 14px",
              padding: 6,
            }}
          >
            <QrGlyph />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "#8F4029" }}>
            Anna &amp; Lukas
          </div>
          <div style={{ fontSize: 10.5, color: "#5C5248", marginTop: 3 }}>annaundlukas.einladi.de</div>
        </div>
      </section>
      <section style={{ padding: "0 22px 40px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#211C19", marginBottom: 5 }}>Tischkarte zum Ausdrucken</div>
        <div style={{ fontSize: 11, color: "#5C5248", marginBottom: 14 }}>Passend zum Design, automatisch erstellt.</div>
        <div style={{ border: "1px solid #E4D9C8", background: "#F3ECDF", padding: "22px 18px", textAlign: "center", position: "relative" }}>
          <div style={{ position: "absolute", top: 7, left: 7, right: 7, bottom: 7, border: "1px solid #B9975B" }} />
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "#8F4029", marginTop: 8 }}>
            Haltet den Moment fest
          </div>
          <div style={{ width: 56, height: 56, background: "#FAF6EF", border: "1px solid #E4D9C8", margin: "12px auto 6px", padding: 4 }}>
            <QrGlyph small />
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.08em", color: "#8A7F6E" }}>TISCH [NR.]</div>
        </div>
      </section>
    </div>
  );
}

// KI-generierte Beispielfotos (OpenAI, gpt-image-2 — siehe scripts/gen-
// gallery-photos.ts) statt einfarbiger Platzhalter-Kacheln: zeigen bewusst
// keine echten Gaeste (waeren personenbezogen), sondern frei erfundene
// Feier-Szenen, passend zur warmen Gold-Bildsprache der Seite. Zwei davon
// zusaetzlich mit Video-Play-Icon markiert, passend zur "12 Videos"-Angabe
// darunter.
const GALLERY_TILES: { src: string; video?: boolean }[] = [
  { src: "/images/marketing/toast.jpg" },
  { src: "/images/marketing/dancing.jpg", video: true },
  { src: "/images/marketing/confetti.jpg" },
  { src: "/images/marketing/grouphug.jpg" },
  { src: "/images/marketing/selfie.jpg", video: true },
  { src: "/images/marketing/cheers.jpg" },
];

function PlayBadge() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(20,16,13,0.18)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(20,16,13,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FAF6EF">
          <path d="M6 4l15 8-15 8V4z" />
        </svg>
      </div>
    </div>
  );
}

export function GalleryPreview() {
  return (
    <div style={{ width: "100%", fontFamily: "var(--font-body)", color: "#2A2420" }}>
      <header style={{ padding: "22px 22px 4px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "#8F4029" }}>
          Live von der Feier
        </div>
        <div style={{ fontSize: 11, color: "#5C5248", marginTop: 3 }}>86 Fotos · 12 Videos · 34 Grüße</div>
      </header>
      <div style={{ padding: "14px 22px 4px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 5 }}>
        {GALLERY_TILES.map((tile, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              aspectRatio: "1",
              backgroundImage: `url(${tile.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {tile.video && <PlayBadge />}
          </div>
        ))}
      </div>
      <section style={{ marginTop: 22, padding: "26px 22px", background: "#211C19" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#FAF6EF", marginBottom: 6 }}>
          Video-Gästebuch
        </div>
        <div style={{ fontSize: 11, color: "#C9C1B8", lineHeight: 1.55, marginBottom: 18 }}>
          Hinterlasst eine kurze Videobotschaft – statt nur ein paar Zeilen im Buch.
        </div>
        <div
          style={{
            background: "#2C2622",
            border: "1px solid #3A332D",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#B2543A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FAF6EF">
              <circle cx="12" cy="12" r="8" />
            </svg>
          </div>
          <div style={{ fontSize: 11.5, color: "#FAF6EF", fontWeight: 600 }}>Nachricht aufnehmen</div>
          <div style={{ fontSize: 10, color: "#9A9086" }}>bis zu 60 Sekunden</div>
        </div>
      </section>
      <div style={{ padding: "16px 22px 30px", display: "flex", gap: 9, alignItems: "flex-start" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8F9B6E" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div style={{ fontSize: 10.5, lineHeight: 1.5, color: "#5C5248" }}>
          Inhalte werden vor der Veröffentlichung freigegeben.
        </div>
      </div>
    </div>
  );
}

function QrGlyph({ small = false }: { small?: boolean }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 21 21">
      <rect x="0" y="0" width="7" height="7" fill="#211C19" />
      <rect x="1.5" y="1.5" width="4" height="4" fill="#F3ECDF" />
      <rect x="14" y="0" width="7" height="7" fill="#211C19" />
      <rect x="15.5" y="1.5" width="4" height="4" fill="#F3ECDF" />
      <rect x="0" y="14" width="7" height="7" fill="#211C19" />
      <rect x="1.5" y="15.5" width="4" height="4" fill="#F3ECDF" />
      {!small && (
        <>
          <rect x="9" y="9" width="1.4" height="1.4" fill="#211C19" />
          <rect x="11" y="11" width="1.4" height="1.4" fill="#211C19" />
          <rect x="9" y="16" width="1.4" height="1.4" fill="#211C19" />
        </>
      )}
    </svg>
  );
}
