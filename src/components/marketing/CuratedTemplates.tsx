import Link from "next/link";
import type { CSSProperties } from "react";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";
import { tiltForId, envelopeMaterialFor } from "@/components/marketing/TemplateGallery";
import type { GalleryCategory } from "@/lib/gallery-templates";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

// Kapitel 04 auf der Startseite zeigte bisher den kompletten 50-Vorlagen-
// Katalog direkt eingebettet (~7700px Bildschirmhoehe) — widerspricht dem
// MOTION.md-Leitsatz "kuratierte Abfolge, kein endloses Scrollen" UND dem
// bereits vorhandenen Kapitel-Text ("Bewusst kuratiert statt endlos"), der
// dadurch schlicht nicht stimmte. Diese Funktion waehlt eine feste,
// ueberschaubare Auswahl: alle Vorlagen mit einem echten Foto-Hintergrund
// (PHOTO_BACKGROUND in gallery-templates.ts) statt Farbverlauf-Fallback —
// diese sind visuell staerker UND die Auswahl bleibt automatisch aktuell,
// sobald in Plan-Phase E weitere Fotos eingekauft werden, ohne Code-
// Aenderung hier. Ergebnis aktuell: 12 Vorlagen ueber alle 10 Kategorien
// verteilt, davon 3 aus Düğün (wichtigster Vertriebskanal laut
// Projektwissen: tuerkische Hochzeitssaele).
export function curatedTemplates(categories: GalleryCategory[]) {
  return categories.flatMap((cat) => cat.items.filter((item) => item.photoBackground).map((item) => ({ ...item, category: cat.category })));
}

export function CuratedTemplates({ categories, paket }: { categories: GalleryCategory[]; paket?: string }) {
  const items = curatedTemplates(categories);
  return (
    <div className="cat-grid">
      {items.map((item) => {
        const material = envelopeMaterialFor(item.colors, item.category);
        return (
        <Link
          key={item.id}
          href={paket ? `/gestalten/${item.id}?paket=${paket}` : `/gestalten/${item.id}`}
          className="tpl"
          style={{ "--tpl-rotate": `${tiltForId(item.id)}deg` } as CSSProperties}
        >
          <span className="tpl-open-hint">Design anpassen</span>
          {/* Dieselbe Handy-Mockup+Karte-Flatlay wie /vorlagen
              (TemplateGallery.tsx) — docs/MOTION.md §3, CLAUDE.md Regel 6:
              Startseiten-Vorschau und volle Galerie muessen sich wie
              dasselbe Produkt anfuehlen. */}
          <div className="tpl-flatlay">
            <div
              className="tpl-phone"
              style={{ backgroundImage: `linear-gradient(135deg, ${item.colors.background}40, ${item.colors.accent}26), url(${material.photo})` }}
            >
              <span className="tpl-phone-notch" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element -- kleines statisches Deko-Asset */}
              <img className="tpl-phone-seal" src={material.seal} alt="" />
            </div>
            <div className="tpl-card-slot">
              <TemplatePreview layoutKey={item.layoutKey} />
            </div>
          </div>
          <span className="tpl-label">
            <span>{item.name}</span>
            {item.priceCents > 0 && <span className="tpl-price">{eur.format(item.priceCents / 100)}</span>}
          </span>
        </Link>
        );
      })}
    </div>
  );
}
