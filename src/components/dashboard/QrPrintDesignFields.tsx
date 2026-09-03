"use client";

import { useState } from "react";
import { PRINT_SIZE_MM, QR_THEMES, type PrintSize, type QrTheme } from "@/lib/qr-design";

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
}: {
  eventId: string;
  tables: { id: string; name: string }[];
}) {
  const [tableId, setTableId] = useState("");
  const [size, setSize] = useState<PrintSize>("A6");
  const [theme, setTheme] = useState<QrTheme>("classic");

  const previewSrc = `/dashboard/events/${eventId}/qr/design-preview?theme=${theme}&size=${size}${tableId ? `&tableId=${tableId}` : ""}`;
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
        <a
          href={downloadSrc}
          download
          className="btn btn-ghost"
          style={{ padding: "10px 18px", fontSize: 12.5, alignSelf: "flex-start" }}
        >
          Herunterladen (SVG)
        </a>
      </div>
      <div style={{ flex: "0 0 140px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- serverseitig generiertes SVG, kein next/image-Asset */}
        <img
          key={previewSrc}
          src={previewSrc}
          alt="Vorschau des Karten-Designs"
          style={{ width: "100%", border: "1px solid var(--line)", background: "#fff", display: "block" }}
        />
      </div>
    </div>
  );
}
