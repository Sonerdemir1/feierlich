"use client";

import { useRef, useState, type ReactNode } from "react";

// Alternative zu EnvelopeOpen.tsx (CSS-Animation) / EnvelopeReveal.tsx
// (Bildsequenz) — spielt beim Antippen ein vom Gastgeber hochgeladenes
// Video ab, danach erscheint die eigentliche Einladung. "Überspringen"
// bleibt jederzeit erreichbar, falls jemand nicht warten will.
export function VideoEnvelope({ videoUrl, primary, children }: { videoUrl: string; primary: string; children: ReactNode }) {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleTap() {
    if (phase !== "idle") return;
    setPhase("playing");
    videoRef.current?.play().catch(() => setPhase("done"));
  }

  if (phase === "done") return <>{children}</>;

  return (
    <div style={{ maxWidth: 360, margin: "0 auto" }}>
      <button
        type="button"
        onClick={handleTap}
        aria-label="Video abspielen"
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          padding: 0,
          border: "none",
          background: "none",
          cursor: phase === "idle" ? "pointer" : "default",
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          onEnded={() => setPhase("done")}
          style={{ width: "100%", borderRadius: 10, display: "block" }}
        />
        {phase === "idle" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.28)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                color: "#211C19",
                paddingLeft: 3,
              }}
            >
              ▶
            </div>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={() => setPhase("done")}
        style={{ marginTop: 12, fontSize: 11.5, opacity: 0.65, background: "none", border: "none", cursor: "pointer", color: primary }}
      >
        Überspringen →
      </button>
    </div>
  );
}
