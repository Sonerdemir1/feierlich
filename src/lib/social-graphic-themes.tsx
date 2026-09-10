import type { SocialGraphicFormat } from "./social-graphic";

// Weitere Layout-Varianten fuer die Social-Grafik (Bestandsaufnahme Punkt
// F(b)) — gleiches Muster wie die drei QR-Design-Themes in qr-design.ts
// (Klassisch/Modern/Opulent), nur als next/og-JSX statt SVG-String, da
// social-graphic/route.tsx Satori (next/og) statt der eigenen SVG-Komposition
// nutzt. Reine, hook-freie JSX-Funktionen — Satori braucht auf praktisch
// jedem Element ein explizites display (kein CSS-Default), siehe bestehendes
// Layout in route.tsx.

export type SocialGraphicTheme = "classic" | "modern-block" | "gold-frame";

export const SOCIAL_GRAPHIC_THEMES: Array<{ id: SocialGraphicTheme; label: string }> = [
  { id: "classic", label: "Klassisch — zentriert" },
  { id: "modern-block", label: "Modern — kräftige Farbfläche" },
  { id: "gold-frame", label: "Opulent — Rahmen mit Zierlinie" },
];

export type SocialGraphicThemeInput = {
  format: SocialGraphicFormat;
  width: number;
  height: number;
  colors: { primary: string; accent: string; background: string };
  eventTypeName: string;
  title: string;
  subtitle?: string | null;
  dateLabel: string;
  locationName?: string | null;
  qrDataUri: string;
  qrSize: number;
  displayFont?: string;
  bodyFont?: string;
};

export function classicTheme(p: SocialGraphicThemeInput) {
  const { format, colors, eventTypeName, title, subtitle, dateLabel, locationName, qrDataUri, qrSize, displayFont, bodyFont } = p;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: colors.background,
        padding: 90,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, textTransform: "uppercase", color: colors.accent, fontFamily: bodyFont }}>
        {eventTypeName}
      </div>
      <div style={{ display: "flex", fontSize: format === "post" ? 58 : 72, fontWeight: 700, color: colors.primary, marginTop: 26, fontFamily: displayFont }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ display: "flex", fontSize: 28, color: colors.primary, opacity: 0.8, marginTop: 18, fontFamily: bodyFont }}>{subtitle}</div>
      )}
      <div style={{ display: "flex", width: 64, height: 2, background: colors.accent, marginTop: 44, marginBottom: 44 }} />
      <div style={{ display: "flex", fontSize: 30, color: colors.primary, fontFamily: bodyFont }}>{dateLabel}</div>
      {locationName && (
        <div style={{ display: "flex", fontSize: 24, color: colors.primary, opacity: 0.75, marginTop: 10, fontFamily: bodyFont }}>{locationName}</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 64 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) rendert kein next/image, nur <img> */}
        <img src={qrDataUri} alt="" width={qrSize} height={qrSize} style={{ borderRadius: 10 }} />
        <div style={{ display: "flex", fontSize: 18, color: colors.primary, opacity: 0.7, marginTop: 14, fontFamily: bodyFont }}>
          Scannt für die Einladung
        </div>
      </div>
    </div>
  );
}

// Kraeftige Farbflaeche oben (Accent, volle Breite) mit dem Titel in Weiss —
// Pendant zum "modern-block"-QR-Design-Theme. Der untere Bereich bleibt hell
// fuer Datum/Ort/QR, damit der QR-Code weiterhin gut scanbar auf hellem
// Grund liegt statt auf der kraeftigen Farbe.
export function modernBlockTheme(p: SocialGraphicThemeInput) {
  const { format, colors, eventTypeName, title, subtitle, dateLabel, locationName, qrDataUri, qrSize, displayFont, bodyFont } = p;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: colors.accent,
          padding: "80px 70px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#FFFFFFCC", fontFamily: bodyFont }}>
          {eventTypeName}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: format === "post" ? 56 : 68,
            fontWeight: 700,
            color: "#FFFFFF",
            marginTop: 22,
            letterSpacing: 0.5,
            fontFamily: displayFont,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ display: "flex", fontSize: 26, color: "#FFFFFFDD", marginTop: 16, fontFamily: bodyFont }}>{subtitle}</div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          // Zentriert wie beim "classic"-Theme — bewusst NICHT oben
          // angepinnt: bei "story" (1080x1920) haelt das den Inhalt aus der
          // Instagram-eigenen Bedienoberflaeche am oberen/unteren Rand
          // heraus (Safe-Zone-Konvention fuer Story-Formate).
          justifyContent: "center",
          padding: "0 70px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: colors.primary, fontWeight: 700, fontFamily: bodyFont }}>{dateLabel}</div>
        {locationName && (
          <div style={{ display: "flex", fontSize: 24, color: colors.primary, opacity: 0.75, marginTop: 10, fontFamily: bodyFont }}>{locationName}</div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 50,
            padding: 24,
            border: `2px solid ${colors.accent}`,
            borderRadius: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) rendert kein next/image, nur <img> */}
          <img src={qrDataUri} alt="" width={qrSize} height={qrSize} style={{ borderRadius: 8 }} />
        </div>
        <div style={{ display: "flex", fontSize: 18, color: colors.primary, opacity: 0.7, marginTop: 16, fontFamily: bodyFont }}>
          Scannt für die Einladung
        </div>
      </div>
    </div>
  );
}

// Doppelter Rahmen mit Innenabstand + kursiver Titel + verzierter
// Mittel-Trenner — Pendant zum "gold-frame"-QR-Design-Theme, ohne die dort
// per SVG-Pfad gezeichneten Eck-Klammern (in Satori/next/og deutlich
// aufwaendiger, einfache Rahmenlinien tragen den "Opulent"-Charakter hier
// bereits gut).
export function goldFrameTheme(p: SocialGraphicThemeInput) {
  const { format, colors, eventTypeName, title, subtitle, dateLabel, locationName, qrDataUri, qrSize, displayFont, bodyFont } = p;
  const framePad = format === "post" ? 46 : 56;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: colors.background, padding: framePad }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${colors.accent}`,
          padding: 14,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${colors.accent}`,
            padding: "56px 60px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 7, textTransform: "uppercase", color: colors.accent, fontFamily: bodyFont }}>
            {eventTypeName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: format === "post" ? 54 : 66,
              fontStyle: "italic",
              color: colors.primary,
              marginTop: 24,
              fontFamily: displayFont,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ display: "flex", fontSize: 26, color: colors.primary, opacity: 0.8, marginTop: 16, fontFamily: bodyFont }}>{subtitle}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", marginTop: 38, marginBottom: 38 }}>
            <div style={{ display: "flex", width: 36, height: 1, background: colors.accent }} />
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                margin: "0 10px",
                background: colors.accent,
                transform: "rotate(45deg)",
              }}
            />
            <div style={{ display: "flex", width: 36, height: 1, background: colors.accent }} />
          </div>
          <div style={{ display: "flex", fontSize: 28, color: colors.primary, fontFamily: bodyFont }}>{dateLabel}</div>
          {locationName && (
            <div style={{ display: "flex", fontSize: 22, color: colors.primary, opacity: 0.75, marginTop: 8, fontFamily: bodyFont }}>{locationName}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 46 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) rendert kein next/image, nur <img> */}
            <img src={qrDataUri} alt="" width={qrSize} height={qrSize} style={{ borderRadius: 6 }} />
            <div style={{ display: "flex", fontSize: 17, color: colors.primary, opacity: 0.7, marginTop: 12, fontFamily: bodyFont }}>
              Scannt für die Einladung
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderSocialGraphicTheme(theme: SocialGraphicTheme, input: SocialGraphicThemeInput) {
  if (theme === "modern-block") return modernBlockTheme(input);
  if (theme === "gold-frame") return goldFrameTheme(input);
  return classicTheme(input);
}
