import type { MetadataRoute } from "next";

// Nur die Marketing-Startseite ist oeffentlich indexierbarer Inhalt —
// Event-Seiten sind private Einladungen (siehe robots.ts) und Kunden-/
// Admin-/Partner-Bereiche brauchen kein SEO.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
