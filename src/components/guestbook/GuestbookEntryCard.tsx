"use client";

import { useState } from "react";

type Colors = { primary: string; accent: string; background: string };

export function GuestbookEntryCard({
  authorName,
  message,
  translatedMessage,
  mediaUrl,
  mediaType,
  colors,
}: {
  authorName: string;
  message: string | null;
  translatedMessage: string | null;
  mediaUrl: string | null;
  mediaType: "VIDEO" | "IMAGE" | "AUDIO" | null;
  colors: Colors;
}) {
  const [showTranslation, setShowTranslation] = useState(true);
  const hasTranslation = Boolean(translatedMessage);

  return (
    <div style={{ border: `1px solid ${colors.accent}33`, padding: "14px 16px" }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{authorName}</div>
      {message && (
        <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>
          {hasTranslation && showTranslation ? translatedMessage : message}
        </div>
      )}
      {hasTranslation && (
        <button
          type="button"
          onClick={() => setShowTranslation((v) => !v)}
          style={{
            marginTop: 6,
            fontSize: 11,
            color: colors.accent,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {showTranslation ? "Original anzeigen" : "Deutsche Übersetzung anzeigen"}
        </button>
      )}
      {mediaUrl && mediaType === "VIDEO" && (
        <video src={mediaUrl} controls style={{ width: "100%", maxWidth: 200, marginTop: 8, display: "block" }} />
      )}
      {mediaUrl && mediaType !== "VIDEO" && (
        // eslint-disable-next-line @next/next/no-img-element -- guest upload, unknown dimensions
        <img src={mediaUrl} alt="" style={{ width: "100%", maxWidth: 200, marginTop: 8, display: "block" }} />
      )}
    </div>
  );
}
