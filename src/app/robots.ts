import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Event-Seiten sind private Einladungen (per Link/QR geteilt, nicht
      // fuer Suchmaschinen gedacht); Login/Dashboard/Admin/Partner sind
      // interne Bereiche.
      disallow: ["/e/", "/login", "/dashboard", "/admin", "/partner", "/p/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
