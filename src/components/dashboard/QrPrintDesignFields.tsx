"use client";

import { useState } from "react";
import { PRINT_SIZE_MM, QR_THEMES, type PrintSize, type QrTheme } from "@/lib/qr-design";
import { FONT_OPTIONS } from "@/lib/fonts";

const selectStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  background: "var(--ivory-2)",
  fontSize: 13,
  flex: "1 1 160px",
  minWidth: 0,
};

// Eigene Client-Komponente statt der frueheren blinden <select>-Dropdowns —
// aendert der Nutzer Tisch/Groesse/Theme, aktualisiert sich die Vorschau
// rechts sofort per Query-Param an dieselbe Route, die der Download-Link
// nutzt (nur mit &download=1) — Vorschau und heruntergeladene Datei sind
// dadurch immer exakt dasselbe Design. Kunden drucken selbst aus, kein
// Druck-und-Versand-Auftrag noetig.
export function QrPrintDesignFields({
  eventId,
  tables,
  initialAccentColor,
  initialInstructionsText,
  saveQrDesignFieldsAction,
}: {
  eventId: string;
  tables: { id: string; name: string }[];
  // Bestandsaufnahme Punkt C2/C4 — gespeicherte Werte, Startzustand der
  // beiden neuen Felder unten.
  initialAccentColor: string;
  initialInstructionsText: string;
  saveQrDesignFieldsAction: (formData: FormData) => void;
}) {
  const [tableId, setTableId] = useState("");
  const [size, setSize] = useState<PrintSize>("A6");
  // "gold-frame" (Zierrahmen mit Zweig-Icon) statt "classic" als Standard —
  // orientiert sich an der vom Kunden hochgeladenen Referenz (QR-CARD-Ordner)
  // und am opulenten Gold-Look, den die Zielgruppe (tuerkische Hochzeiten)
  // erwartet, siehe docs/MOTION.md-Kontext.
  const [theme, setTheme] = useState<QrTheme>("gold-frame");
  // "" = Schriftart des Events uebernehmen (Server-Default) statt einer der
  // kuratierten Optionen fest vorzugeben.
  const [fontId, setFontId] = useState("");
  // Klick-zum-Vergroessern (Bestandsaufnahme Punkt C3) — die feste
  // 140px-Vorschau war zu klein, um Details zu erkennen. Rein clientseitig:
  // dieselbe previewSrc wird nur in einem groesseren Overlay erneut
  // gerendert, kein zusaetzlicher Server-Aufruf noetig.
  const [enlarged, setEnlarged] = useState(false);
  // Eigene QR-Akzentfarbe (C2) + eigener Anleitungstext (C4) — Aenderung
  // wirkt SOFORT auf die Vorschau (gleiches "Query-Param vor dem
  // Speichern"-Muster wie Theme/Groesse/Schrift oben), muss aber ueber den
  // eigenen "Speichern"-Button unten dauerhaft gemacht werden.
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const [instructionsText, setInstructionsText] = useState(initialInstructionsText);

  const previewSrc = `/dashboard/events/${eventId}/qr/design-preview?theme=${theme}&size=${size}${tableId ? `&tableId=${tableId}` : ""}${fontId ? `&fontId=${fontId}` : ""}${accentColor ? `&accent=${encodeURIComponent(accentColor)}` : ""}${instructionsText ? `&instructions=${encodeURIComponent(instructionsText)}` : ""}`;
  const downloadSrc = `${previewSrc}&download=1`;

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10, flex: "1 1 320px" }}>
        <select value={tableId} onChange={(e) => setTableId(e.target.value)} style={selectStyle}>
          <option value="">Allgemeine Einladungsseite</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={size} onChange={(e) => setSize(e.target.value as PrintSize)} style={selectStyle}>
          {(Object.keys(PRINT_SIZE_MM) as PrintSize[]).map((s) => (
            <option key={s} value={s}>
              {PRINT_SIZE_MM[s].label}
            </option>
          ))}
        </select>
        <select value={theme} onChange={(e) => setTheme(e.target.value as QrTheme)} style={selectStyle}>
          {QR_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <select value={fontId} onChange={(e) => setFontId(e.target.value)} style={selectStyle}>
          <option value="">Schriftart wie Einladung</option>
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <a
          href={downloadSrc}
          download
          className="btn btn-ghost"
          style={{ padding: "10px 18px", fontSize: 12.5, alignSelf: "flex-start" }}
        >
          Herunterladen (SVG)
        </a>

        <form
          action={saveQrDesignFieldsAction}
          style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", width: "100%", marginTop: 4 }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
            Eigene Akzentfarbe
            <input
              type="color"
              name="qrAccentColor"
              value={accentColor || "#B9975B"}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{ width: 34, height: 30, border: "1px solid var(--line)", cursor: "pointer", padding: 0 }}
            />
          </label>
          {accentColor && (
            <button
              type="button"
              onClick={() => setAccentColor("")}
              style={{ fontSize: 11, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Zurücksetzen auf Hauptfarbe
            </button>
          )}
          <input
            name="qrInstructionsText"
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value.slice(0, 160))}
            placeholder="Scannt den Code, um Fotos & Videos zu teilen"
            style={{ flex: "1 1 220px", padding: "9px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 12.5 }}
          />
          <button type="submit" className="btn btn-ghost" style={{ padding: "9px 14px", fontSize: 12 }}>
            Speichern
          </button>
        </form>
      </div>
      <div style={{ flex: "0 0 140px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- serverseitig generiertes SVG, kein next/image-Asset */}
        <img
          key={previewSrc}
          src={previewSrc}
          alt="Vorschau des Karten-Designs — zum Vergrößern anklicken"
          onClick={() => setEnlarged(true)}
          style={{ width: "100%", border: "1px solid var(--line)", background: "#fff", display: "block", cursor: "zoom-in" }}
        />
        <div style={{ fontSize: 10.5, color: "var(--ink-faint)", marginTop: 4, textAlign: "center" }}>Zum Vergrößern anklicken</div>
      </div>

      {enlarged && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setEnlarged(false)}
          onKeyDown={(e) => e.key === "Escape" && setEnlarged(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 32,
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- serverseitig generiertes SVG, kein next/image-Asset */}
          <img
            src={previewSrc}
            alt="Vorschau des Karten-Designs, vergrößert"
            style={{ maxWidth: "min(90vw, 640px)", maxHeight: "90vh", width: "auto", background: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}
          />
        </div>
      )}
    </div>
  );
}
