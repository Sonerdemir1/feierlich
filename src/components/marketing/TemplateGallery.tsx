import Link from "next/link";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";
import { categorySlug, categoryLabel, type GalleryCategory } from "@/lib/gallery-templates";
import type { Locale } from "@/lib/i18n";

export type { GalleryCategory, GalleryTemplate } from "@/lib/gallery-templates";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

// Reines Kachel-Raster ohne eigenen Client-State — Klick auf eine Vorlage
// fuehrt auf die dedizierte Design-Studio-Seite (/gestalten/[id]) statt ein
// Overlay auf der Startseite zu oeffnen. Der kleine, feste Overlay-Ausschnitt
// war auf schmaleren Fensterbreiten zu eng fuer Kartenvorschau + Optionen
// gleichzeitig — eine eigene Seite hat den ganzen Viewport zur Verfuegung.
export function TemplateGallery({ categories, locale }: { categories: GalleryCategory[]; locale: Locale }) {
  return (
    <>
      <div className="tpl-filter-row">
        {categories.map(({ category }) => (
          <a key={category} href={`#cat-${categorySlug(category)}`} className="tpl-filter-pill">
            {categoryLabel(category, locale)}
          </a>
        ))}
      </div>

      {categories.map(({ category, subtitle, items }) => (
        <div className="cat" key={category} id={`cat-${categorySlug(category)}`}>
          <div className="cat-head">
            <h3>{categoryLabel(category, locale)}</h3>
            <span className="cat-sub">{subtitle}</span>
          </div>
          <div className="cat-grid">
            {items.map((item) => (
              <Link key={item.id} href={`/gestalten/${item.id}`} className="tpl">
                <span className="tpl-open-hint">Design anpassen</span>
                <TemplatePreview layoutKey={item.layoutKey} />
                <span className="tpl-label">
                  <span>{item.name}</span>
                  {item.priceCents > 0 && <span className="tpl-price">{eur.format(item.priceCents / 100)}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
