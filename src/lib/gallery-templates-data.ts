import { prisma } from "@/lib/prisma";
import {
  type Colors,
  type GalleryCategory,
  defaultTextForCategory,
  defaultEventLabelForCategory,
  PHOTO_BACKGROUND,
  CATEGORY_SUBTITLE,
} from "@/lib/gallery-templates";

// Getrennt von gallery-templates.ts (Prisma-Import waere in einer
// Client-Komponente wie DesignStudio.tsx sonst ein Build-Fehler, siehe
// Kommentar dort) — nur von Server-Components importieren.
export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  const templates = await prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });

  const byCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  return [...byCategory.entries()].map(([category, items]) => ({
    category,
    subtitle: CATEGORY_SUBTITLE[category] ?? "",
    items: items.map((t) => ({
      id: t.id,
      name: t.name,
      layoutKey: t.layoutKey,
      priceCents: t.priceCents,
      colors: JSON.parse(t.colors) as Colors,
      defaultText: defaultTextForCategory(category),
      defaultEventLabel: defaultEventLabelForCategory(category),
      photoBackground: PHOTO_BACKGROUND[t.layoutKey] ?? null,
      cardImageUrl: t.previewUrl,
    })),
  }));
}
