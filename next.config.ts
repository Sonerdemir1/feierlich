import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js' Server-Action-Default (1 MB) liegt weit unter unserem eigenen
  // Video-Limit (MAX_VIDEO_BYTES, src/lib/uploads.ts) — ohne dies scheitert
  // jeder Foto-/Video-Upload ueber uploadGalleryPhoto()/submitGuestbookEntry()
  // schon am Next.js-Request selbst, bevor unsere eigene Validierung
  // ueberhaupt laeuft. 110mb laesst etwas Spielraum ueber dem 100 MB
  // Video-Limit fuer den Multipart-Overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: "110mb",
    },
  },
  async headers() {
    return [
      // Erster Versuch (zwei ueberlappende Regeln, DENY + SAMEORIGIN fuer
      // denselben Pfad) hat NICHT funktioniert — Next.js haengt bei
      // ueberlappenden source-Mustern beide Werte an denselben Header an,
      // der Browser sieht dann zwei X-Frame-Options-Werte und blockt
      // weiterhin. Fix: die beiden Regeln schliessen sich jetzt per
      // Regex gegenseitig aus, jeder Pfad matcht nur noch genau eine.
      {
        source: "/:path((?!e/).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Oeffentliche Event-Seite: die Haupt-Event-Seite im Dashboard
      // bettet sie in ein <iframe> als Live-Design-Vorschau ein —
      // SAMEORIGIN statt DENY erlaubt genau das (nur die eigene Seite
      // darf sich selbst einbetten), fremde Seiten koennen weiterhin
      // nicht per Clickjacking-Iframe einbetten.
      {
        source: "/e/:slug*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
