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
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // Ausnahme fuer die oeffentliche Event-Seite: der Design-Editor
      // (dashboard/events/[id]/design) bettet sie in ein <iframe> als
      // Live-Vorschau ein — SAMEORIGIN statt DENY erlaubt genau das
      // (nur die eigene Seite darf sich selbst einbetten), fremde Seiten
      // koennen weiterhin nicht per Clickjacking-Iframe einbetten. Muss
      // NACH der allgemeinen Regel stehen, damit sie fuer diesen Pfad
      // gewinnt.
      {
        source: "/e/:slug*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;
