"use client";

import { useState } from "react";
import { SOCIAL_GRAPHIC_SIZES, type SocialGraphicFormat } from "@/lib/social-graphic";

export function SocialGraphicPreview({ eventId }: { eventId: string }) {
  const [format, setFormat] = useState<SocialGraphicFormat>("story");

  const previewSrc = `/dashboard/events/${eventId}/social-graphic?format=${format}`;
  const downloadSrc = `${previewSrc}&download=1`;

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: "0 0 220px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(Object.keys(SOCIAL_GRAPHIC_SIZES) as SocialGraphicFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={format === f ? "btn btn-primary" : "btn btn-ghost"}
              style={{ padding: "8px 14px", fontSize: 12 }}
            >
              {SOCIAL_GRAPHIC_SIZES[f].label.split(" ")[0]}
            </button>
          ))}
        </div>
        <a href={downloadSrc} className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 12.5, display: "inline-block" }}>
          PNG herunterladen
        </a>
      </div>
      <div
        style={{
          flex: "0 0 auto",
          width: format === "post" ? 220 : 160,
          aspectRatio: `${SOCIAL_GRAPHIC_SIZES[format].width} / ${SOCIAL_GRAPHIC_SIZES[format].height}`,
          border: "1px solid var(--line)",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- serverseitig generiertes PNG, kein next/image-Asset */}
        <img key={previewSrc} src={previewSrc} alt="Vorschau der Social-Grafik" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
      </div>
    </div>
  );
}
