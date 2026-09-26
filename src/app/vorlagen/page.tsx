import { getGalleryCategories } from "@/lib/gallery-templates-data";
import { VorlagenGallery } from "./VorlagenGallery";

// Neue eigenstaendige Route fuer den vollen 50-Vorlagen-Katalog (siehe
// docs/MOTION.md §3) — vorher direkt in Kapitel 04 der Startseite
// eingebettet, jetzt dort nur noch eine kuratierte Auswahl mit Link
// hierher (CuratedTemplates.tsx). Gleicher Grund wie bei "/" (force-
// dynamic statt statischem Prerendering: Template-Liste kommt live aus
// Prisma, zur Build-Zeit auf Railway noch keine DB erreichbar).
export const dynamic = "force-dynamic";

export default async function VorlagenPage({ searchParams }: PageProps<"/vorlagen">) {
  const sp = await searchParams;
  const paket = typeof sp.paket === "string" ? sp.paket : undefined;
  const categories = await getGalleryCategories();

  return <VorlagenGallery categories={categories} paket={paket} />;
}
