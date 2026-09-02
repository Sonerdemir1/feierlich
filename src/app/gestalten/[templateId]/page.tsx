import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGalleryCategories } from "@/lib/gallery-templates-data";
import { getLocale } from "@/lib/i18n";
import { DesignStudio } from "@/components/marketing/DesignStudio";

// Eigene Meta-Titel-Sektion statt generateMetadata aus dem Layout — die
// Design-Studio-Seite ist wie die Marketing-Vorschau nicht fuer
// Suchmaschinen gedacht (kein Mehrwert fuer die Indexierung), aber ein
// eigener Tab-Titel hilft beim Hin-und-her-Vergleichen mehrerer Designs.
export async function generateMetadata({ params }: PageProps<"/gestalten/[templateId]">): Promise<Metadata> {
  const { templateId } = await params;
  const categories = await getGalleryCategories();
  const item = categories.flatMap((c) => c.items).find((i) => i.id === templateId);
  return { title: item ? `${item.name} gestalten – einladi` : "Design gestalten – einladi", robots: { index: false, follow: false } };
}

export default async function DesignStudioPage({ params }: PageProps<"/gestalten/[templateId]">) {
  const { templateId } = await params;
  const [categories, locale] = await Promise.all([getGalleryCategories(), getLocale()]);
  const flatItems = categories.flatMap((c) => c.items.map((item) => ({ item, category: c.category })));
  const idx = flatItems.findIndex((f) => f.item.id === templateId);
  if (idx === -1) notFound();

  const { item, category } = flatItems[idx];
  const prevId = flatItems.length > 1 ? flatItems[(idx - 1 + flatItems.length) % flatItems.length].item.id : null;
  const nextId = flatItems.length > 1 ? flatItems[(idx + 1) % flatItems.length].item.id : null;

  const otherInCategory = (categories.find((c) => c.category === category)?.items ?? [])
    .filter((i) => i.id !== item.id)
    .slice(0, 6)
    .map((i) => ({ id: i.id, name: i.name, layoutKey: i.layoutKey }));

  return (
    <DesignStudio
      item={item}
      category={category}
      locale={locale}
      prevId={prevId}
      nextId={nextId}
      otherInCategory={otherInCategory}
    />
  );
}
