import { getGalleryCategories } from "@/lib/gallery-templates-data";
import { prisma } from "@/lib/prisma";
import { packageSlug } from "@/lib/packages";
import { HomeChapters } from "./HomeChapters";

// Ohne dies versucht `next build`, diese Seite bei jedem Deploy statisch
// vorzurendern und braucht dafuer eine live erreichbare Datenbank zur
// Build-Zeit — auf Railway (Build-Schritt vor dem Start des
// Postgres-Containers) schlaegt das sonst fehl.
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  // Startseiten-Paket-CTA — ?paket=<packageSlug> reicht das gewaehlte
  // Paket bis zur Vorlagen-Galerie durch (siehe PricingChapter "Dieses
  // Paket waehlen" -> /?paket=<slug>#vorlagen, sowie DesignStudio.tsx
  // initialPackageSlug/TIER_BY_PACKAGE_KEY). Ein ungueltiger Wert faellt
  // im Gestalten-Bereich auf den Premium-Plus-Standard zurueck.
  const paket = typeof sp.paket === "string" ? sp.paket : undefined;

  const [categories, packages, modules, photoVideoAddOn] = await Promise.all([
    getGalleryCategories(),
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany(),
    prisma.addOn.findUnique({ where: { key: "photo-video-collection" } }),
  ]);
  const moduleNameByKey = new Map(modules.map((m) => [m.key, m.name]));

  const packagesForClient = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    priceCents: pkg.priceCents,
    slug: packageSlug(pkg.key),
    highlight: pkg.key === "PREMIUM_PLUS",
    features: (JSON.parse(pkg.features || "[]") as string[]).map((key) => moduleNameByKey.get(key) ?? key),
  }));

  return (
    <HomeChapters
      categories={categories}
      paket={paket}
      packages={packagesForClient}
      photoVideoAddOn={photoVideoAddOn ? { name: photoVideoAddOn.name, priceCents: photoVideoAddOn.priceCents } : null}
    />
  );
}
