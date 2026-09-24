"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "einladi_cookie_notice_seen";

// Liefert false beim SSR/ersten Client-Rendering (identisch, kein Hydration-
// Mismatch), erst danach true — gleiches Muster wie CameraSection.tsx.
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// Kein Consent-Banner im eigentlichen Sinn (Zustimmung einholen), sondern ein
// reiner Hinweis: laut Datenschutzerklaerung (Abschnitt "Cookies") setzt die
// Seite ausschliesslich technisch notwendige Cookies (Sprachauswahl,
// Anmelde-Sitzung) — dafuer ist nach Art. 5 Abs. 3 ePrivacy-RL/§25 TTDSG
// keine Einwilligung noetig, nur eine Information. Ein "Alle akzeptieren /
// Nur notwendige"-Auswahl-Banner waere hier unehrlich, da es keine
// Tracking-/Analyse-Cookies zur Ablehnung gibt.
export function CookieNotice() {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(false);

  if (!mounted) return null;

  let alreadySeen = false;
  try {
    alreadySeen = Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    // localStorage kann in privaten Fenstern/mit blockierten Cookies
    // fehlschlagen — dann zeigen wir den Hinweis einfach ohne dauerhafte
    // Speicherung an, kein kritischer Pfad.
  }
  if (alreadySeen || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // s.o.
    }
  }

  return (
    <div
      role="region"
      aria-label="Cookie-Hinweis"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        maxWidth: 520,
        margin: "0 auto",
        background: "var(--ivory, #faf6ef)",
        border: "1px solid var(--line, #e4d9c8)",
        borderRadius: 10,
        boxShadow: "var(--shadow-md, 0 4px 16px rgba(33,28,25,0.09))",
        padding: "16px 18px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
      }}
    >
      <p style={{ margin: 0, flex: "1 1 260px", fontSize: 13, lineHeight: 1.6, color: "var(--ink, #211c19)" }}>
        Wir verwenden nur technisch notwendige Cookies (Sprachauswahl, Anmelde-Sitzung) — keine Tracking- oder
        Werbe-Cookies.{" "}
        <a href="/datenschutz" style={{ color: "var(--terracotta-dark, #8f4029)" }}>
          Mehr in der Datenschutzerklärung
        </a>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        style={{
          flexShrink: 0,
          padding: "9px 18px",
          background: "var(--terracotta, #b2543a)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Verstanden
      </button>
    </div>
  );
}
