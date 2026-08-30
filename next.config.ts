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
    ];
  },
};

export default nextConfig;
