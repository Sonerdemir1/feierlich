"use client";

import { useState } from "react";
import { PRINT_SIZE_MM, PRINT_PRICE_CENTS, QR_THEMES, type PrintSize, type QrTheme } from "@/lib/qr-design";

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
// rechts sofort per Query-Param an die neue Preview-Route, statt das Design
// erst nach dem Absenden per E-Mail zu sehen.
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

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, rowGap: 10, flex: "1 1 320px" }}>
        <select name="tableId" value={tableId} onChange={(e) => setTableId(e.target.value)} style={selectStyle}>
          <option value="">Allgemeine Einladungsseite</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select name="size" value={size} onChange={(e) => setSize(e.target.value as PrintSize)} style={selectStyle}>
          {(Object.keys(PRINT_SIZE_MM) as PrintSize[]).map((s) => (
            <option key={s} value={s}>
              {PRINT_SIZE_MM[s].label} — {(PRINT_PRICE_CENTS[s] / 100).toFixed(2)} € /Stück
            </option>
          ))}
        </select>
        <select name="theme" value={theme} onChange={(e) => setTheme(e.target.value as QrTheme)} style={selectStyle}>
          {QR_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
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
