"use client";

import { useEffect, useRef, useState } from "react";

// Eingebettete Erklaer-Story auf der Startseite: wein/gold, opulente
// Optik passend zur tuerkischen Duegue-Vorlage (Hauptzielgruppe), nicht
// die neutrale Marken-Palette. Autoplay + manuelle Navigation, respektiert
// prefers-reduced-motion.
type Beat = {
  eyebrow: string;
  headline: string;
  body: string;
  graphic: string;
  isFinal?: boolean;
};

const BEAT_MS = 5200;

const beats: Beat[] = [
  {
    eyebrow: "Für die Braut",
    headline: "Tausend Erinnerungen. Verstreut auf fremden Handys?",
    body: "Nach der Feier wartet ihr wochenlang auf Fotos aus der WhatsApp-Gruppe.",
    graphic: `<div style="position:relative;width:112px;height:90px;">
      <svg style="position:absolute;top:42px;left:-8px;width:24px;height:40px;opacity:.45" viewBox="0 0 26 42" fill="none" stroke="var(--story-gold)" stroke-width="1"><rect x="1" y="1" width="24" height="40" rx="4"/></svg>
      <div style="position:absolute;top:26px;left:6px;width:52px;height:46px;background:#7C4650;border:1px solid rgba(212,175,106,0.45);transform:rotate(-9deg);"></div>
      <div style="position:absolute;top:14px;left:32px;width:52px;height:46px;background:#9A5A4A;border:1px solid rgba(212,175,106,0.45);transform:rotate(5deg);"></div>
      <div style="position:absolute;top:2px;left:58px;width:52px;height:46px;background:#5E3A46;border:1px solid rgba(212,175,106,0.45);transform:rotate(-4deg);"></div>
    </div>`,
  },
  {
    eyebrow: "Warum digital?",
    headline: "Nicht jede Adresse kennt ihr. Aber jede Nummer.",
    body: "Keine Anschrift nötig — ein Link reicht per WhatsApp, SMS oder Insta.",
    graphic: `<div style="display:flex;align-items:center;gap:10px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
        <div class="story-chip" style="border-color:rgba(212,175,106,0.3);color:rgba(212,175,106,0.35);position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7l9 6 9-6M4 5h16v14H4z"/></svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><div style="width:32px;height:1px;background:#c96b6b;transform:rotate(45deg);"></div></div>
        </div>
        <div class="story-mock-label">Adresse</div>
      </div>
      <svg width="18" height="13" viewBox="0 0 20 14" fill="none" stroke="var(--story-gold)" stroke-width="1.4"><path d="M0 7h17M11 1l6 6-6 6"/></svg>
      <div style="display:flex;gap:6px;">
        <div class="story-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v3a2 2 0 01-2 2C9.6 19 5 14.4 5 8a2 2 0 011-2z"/></svg></div>
        <div class="story-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h16v16H4z"/><path d="M4 5l8 7 8-7"/></svg></div>
        <div class="story-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 4L3 11l6 2 2 6z"/></svg></div>
      </div>
    </div>`,
  },
  {
    eyebrow: "Auf der Feier",
    headline: "Der Tisch trägt den Zugang.",
    body: "Ein Scan — schon sind eure Gäste auf der Seite. Kein Download.",
    graphic: `<div class="story-mock" style="width:96px;padding:11px 8px;text-align:center;position:relative;">
      <div style="position:absolute;inset:5px;border:1px solid rgba(212,175,106,0.3);"></div>
      <div style="width:48px;height:48px;margin:4px auto 7px;background:rgba(246,238,224,0.92);padding:5px;">
        <svg viewBox="0 0 21 21" width="100%" height="100%"><rect x="0" y="0" width="7" height="7" fill="#2e0912"/><rect x="1.5" y="1.5" width="4" height="4" fill="#f6eee0"/><rect x="14" y="0" width="7" height="7" fill="#2e0912"/><rect x="15.5" y="1.5" width="4" height="4" fill="#f6eee0"/><rect x="0" y="14" width="7" height="7" fill="#2e0912"/><rect x="1.5" y="15.5" width="4" height="4" fill="#f6eee0"/><rect x="9" y="9" width="1.6" height="1.6" fill="#2e0912"/><rect x="11" y="12" width="1.6" height="1.6" fill="#2e0912"/><rect x="9" y="16" width="1.6" height="1.6" fill="#2e0912"/></svg>
      </div>
      <div class="story-mock-label">TISCH 12</div>
    </div>`,
  },
  {
    eyebrow: "Ort & Anfahrt",
    headline: "Die Route, ohne Nachfragen.",
    body: "Adresse und Google-Maps-Vorschau direkt auf der Einladung.",
    graphic: `<div class="story-mock" style="width:172px;">
      <div style="height:64px;background:rgba(212,175,106,0.08);position:relative;overflow:hidden;">
        <svg style="position:absolute;inset:0;" viewBox="0 0 172 64"><path d="M0 44 Q54 16 85 34 T172 20" stroke="rgba(212,175,106,0.35)" stroke-width="1.3" fill="none" stroke-dasharray="3 4"/></svg>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="var(--story-gold-bright)" style="position:absolute;top:20px;left:78px;"><path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
      </div>
      <div style="padding:7px 11px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(212,175,106,0.3);">
        <div style="font-size:9.5px;color:var(--story-cream);">Eure Location</div>
        <div style="font-size:8.5px;color:var(--story-gold-bright);">Route ›</div>
      </div>
    </div>`,
  },
  {
    eyebrow: "Sitzplan",
    headline: "Jeder findet seinen Tisch.",
    body: "Name eingeben — der richtige Tisch erscheint sofort.",
    graphic: `<div style="display:flex;flex-direction:column;align-items:center;gap:9px;">
      <div class="story-mock" style="padding:5px 12px;font-size:9.5px;color:var(--story-rose-dim);">Euer Name …</div>
      <div style="display:grid;grid-template-columns:repeat(4,14px);gap:7px;">
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:var(--story-gold-bright);box-shadow:0 0 0 3px rgba(240,206,132,0.25);"></div>
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
        <div style="width:14px;height:14px;border-radius:50%;border:1px solid rgba(212,175,106,0.35);"></div>
      </div>
      <div class="story-mock-label" style="color:var(--story-gold-bright);">TISCH 7 GEFUNDEN</div>
    </div>`,
  },
  {
    eyebrow: "Während der Feier",
    headline: "Fotos & Videos, live vom Fest.",
    body: "Hochgeladen in Sekunden, solange der Moment noch frisch ist.",
    graphic: `<div class="story-mock" style="width:68px;padding:14px 0;display:flex;flex-direction:column;align-items:center;gap:7px;position:relative;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--story-gold)" stroke-width="1.6"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
      <div style="width:27px;height:20px;background:rgba(212,175,106,0.15);border:1px solid rgba(212,175,106,0.4);"></div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8fb98f" stroke-width="2.4" style="position:absolute;top:5px;right:5px;"><path d="M4 12l5 5L20 6"/></svg>
    </div>`,
  },
  {
    eyebrow: "Gästebuch",
    headline: "Worte, die bleiben.",
    body: "Eine Zeile im Buch — oder eine Video-Botschaft, bis 60 Sekunden.",
    graphic: `<div class="story-mock" style="width:134px;padding:12px;text-align:left;">
      <div style="width:60%;height:5px;background:rgba(246,238,224,0.5);margin-bottom:7px;"></div>
      <div style="width:85%;height:4px;background:rgba(246,238,224,0.25);margin-bottom:4px;"></div>
      <div style="width:70%;height:4px;background:rgba(246,238,224,0.25);margin-bottom:10px;"></div>
      <div style="display:flex;align-items:center;gap:7px;">
        <div style="width:22px;height:22px;border-radius:50%;background:var(--story-gold);display:grid;place-items:center;">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--story-wine-deep);"></div>
        </div>
        <div class="story-mock-label" style="color:var(--story-gold-bright);">BIS 60 SEK.</div>
      </div>
    </div>`,
  },
  {
    eyebrow: "Zusagen",
    headline: "Ihr wisst immer, wer kommt.",
    body: "RSVP mit Personenzahl, live gezählt — kein Excel nötig.",
    graphic: `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div style="display:flex;gap:18px;">
        <div style="text-align:center;"><div style="font-family:var(--font-display);font-size:18px;color:var(--story-cream);">42</div><div class="story-mock-label">GÄSTE</div></div>
        <div style="text-align:center;"><div style="font-family:var(--font-display);font-size:18px;color:var(--story-cream);">128</div><div class="story-mock-label">TAGE</div></div>
      </div>
      <div style="display:flex;gap:6px;">
        <div style="padding:5px 10px;background:var(--story-gold);color:var(--story-wine-deep);font-size:8.5px;font-weight:600;">ICH KOMME</div>
        <div style="padding:5px 10px;border:1px solid rgba(212,175,106,0.4);color:var(--story-rose-dim);font-size:8.5px;">LEIDER NICHT</div>
      </div>
    </div>`,
  },
  {
    eyebrow: "Das Ergebnis",
    headline: "Alles an einem Ort. Für euch beide.",
    body: "Fotos, Videos, Nachrichten — sicher gesammelt, für immer.",
    graphic: `<div style="display:grid;grid-template-columns:repeat(3,24px);grid-auto-rows:24px;gap:4px;">
      <div style="background:#7C4650;"></div>
      <div style="background:#C9A15A;"></div>
      <div style="background:#5E3A46;"></div>
      <div style="background:#9A5A4A;"></div>
      <div style="background:#D4AF6A;"></div>
      <div style="background:#4C0F1C;border:1px solid rgba(212,175,106,0.4);"></div>
    </div>`,
    isFinal: true,
  },
];

const storyTokens: React.CSSProperties = {
  ["--story-wine" as string]: "#4c0f1c",
  ["--story-wine-deep" as string]: "#2e0912",
  ["--story-gold" as string]: "#d4af6a",
  ["--story-gold-bright" as string]: "#f0ce84",
  ["--story-cream" as string]: "#f6eee0",
  ["--story-rose-dim" as string]: "#a9737b",
};

export function HeroStory() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotionRef.current) setPlaying(false);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!playing || index === beats.length - 1) return;
    timerRef.current = setTimeout(() => setIndex((i) => i + 1), BEAT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, playing]);

  const goTo = (i: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(beats.length - 1, i)));
  };

  return (
    <section className="story-section reveal">
      <div className="story-head">
        <div className="eyebrow">In 45 Sekunden erklärt</div>
        <h2>So funktioniert einladi</h2>
      </div>

      <div className="story-frame" style={storyTokens}>
        <div className="story-progress-row">
          {beats.map((_, i) => (
            <div
              key={i}
              className={`story-progress-track ${i < index ? "done" : ""} ${i === index ? (playing ? "active" : "done") : ""}`}
              style={{ ["--story-beat-duration" as string]: `${BEAT_MS}ms` }}
            >
              <div className="story-progress-fill" />
            </div>
          ))}
        </div>

        <div className="story-controls">
          <button
            type="button"
            className="story-icon-btn"
            aria-label={playing ? "Pause" : "Abspielen"}
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? (
              <svg viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="3.2" height="10" />
                <rect x="7.8" y="1" width="3.2" height="10" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" fill="currentColor">
                <path d="M1.5 1 L11 6 L1.5 11 Z" />
              </svg>
            )}
          </button>
        </div>

        <div className="story-tap-zones">
          <button type="button" className="story-tap-zone" aria-label="Zurück" onClick={() => goTo(index - 1)} />
          <button type="button" className="story-tap-zone" aria-label="Weiter" onClick={() => goTo(index + 1)} />
        </div>

        {beats.map((b, i) => (
          <div key={i} className={`story-beat ${i === index ? "is-active" : ""}`}>
            <div className="story-beat-graphic" dangerouslySetInnerHTML={{ __html: b.graphic }} />
            <div className="story-eyebrow">{b.eyebrow}</div>
            <h3 className="story-headline">{b.headline}</h3>
            <p className="story-body">{b.body}</p>
            {b.isFinal && (
              <button
                type="button"
                className="story-replay"
                onClick={() => {
                  setIndex(0);
                  setPlaying(!reducedMotionRef.current);
                }}
              >
                Nochmal ansehen
              </button>
            )}
          </div>
        ))}

        <div className="story-nav-hint">TIPPEN ZUM WEITERSPRINGEN</div>
        <div className="story-brandmark" aria-hidden="true">
          einladi
        </div>
      </div>
    </section>
  );
}
