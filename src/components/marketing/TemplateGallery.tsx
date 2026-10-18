"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";
import { categorySlug, categoryLabel, type GalleryCategory } from "@/lib/gallery-templates";
import type { Locale } from "@/lib/i18n";

export type { GalleryCategory, GalleryTemplate } from "@/lib/gallery-templates";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const MotionLink = motion.create(Link);

// docs/MOTION.md §3 "Karten als physische Objekte": Rotation deterministisch
// aus der Template-ID, nicht zufaellig pro Render — sonst springt sie bei
// jedem Re-Render (Suspense, Refetch, ...). Kein externer Hash noetig, ein
// simpler String-Hash reicht fuer eine stabile Pseudo-Zufallszahl.
// Exportiert, damit CuratedTemplates.tsx (Startseiten-Vorschau, Kapitel 04)
// dieselbe deterministische Rotation wie die volle Galerie-Seite nutzt —
// dieselbe Karte muss auf beiden Seiten identisch aussehen.
export function tiltForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const normalized = (Math.abs(hash) % 1000) / 1000;
  return Math.round((-1.8 + normalized * 3.6) * 100) / 100;
}

// MOTION.md §3 "Unterschiedliche Hoehen je nach Kartenformat (Hochkant,
// Quadrat, Panorama). Ein Masonry-Layout, kein starres Grid." — es gibt
// kein Format-Feld im Datenmodell (Template hat kein Aspect-Ratio-Feld,
// siehe gallery-templates.ts GalleryTemplate-Typ), darum wie bei
// tiltForId deterministisch aus der ID abgeleitet statt frei erfunden.
// Mehrheit bleibt Hochkant (5/7, das tatsaechliche Einladungskarten-
// Format), Quadrat/Panorama sind bewusste Ausreisser fuer den Masonry-
// Rhythmus, nicht die Regel.
function formatForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) | 0;
  const bucket = Math.abs(hash) % 10;
  if (bucket < 6) return "5 / 7";
  if (bucket < 9) return "1 / 1";
  return "4 / 3";
}

const cardVariants = {
  hidden: (i: number) => ({ opacity: 0, scale: 0.96, transition: { duration: 0.22, delay: i * 0.03 } }),
  visible: (i: number) => ({ opacity: 1, scale: 1, transition: { duration: 0.28, delay: i * 0.04 } }),
};

// Cross-Document View Transitions API (siehe <meta name="view-transition">
// in vorlagen/page.tsx UND gestalten/[templateId]/page.tsx — der Browser
// verlangt das Opt-in auf BEIDEN Seiten einer Navigation). Next.js' <Link>
// navigiert per Default clientseitig (kein echter Dokumentwechsel, die
// Cross-Document-API greift dabei nicht) — wenn der Browser die API
// unterstuetzt, wird stattdessen bewusst eine echte Navigation ausgeloest,
// damit die Karte beim Oeffnen sichtbar in die Detailansicht uebergeht.
// Kein motion-layoutId-Fallback: das wuerde voraussetzen, dass Ausgangs-
// und Zielelement im selben React-Baum bestehen bleiben, was bei einem
// echten Next.js-Routenwechsel zu /gestalten/[id] nicht der Fall ist
// (eigene Seite, kein Modal/Parallel-Route) — der bereits vorhandene
// Press-/Hover-Feedback der Karte selbst ist der reale Fallback fuer
// Browser ohne API-Unterstuetzung.
function handleOpenClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    e.preventDefault();
    window.location.href = href;
  }
}

// Relative Luminanz (W3C-Naeherung) — exportiert, damit CuratedTemplates.tsx
// (Startseiten-Vorschau) dieselbe Siegel-Farbwahl trifft wie hier, analog zu
// tiltForId oben (dieselbe Karte muss auf beiden Seiten identisch aussehen).
// In EnvelopeOpen.tsx (echte Umschlag-Komponente, andere Oberflaeche) bleibt
// eine eigene, unabhaengige Kopie — kein gemeinsamer Import ueber die
// Marketing/Komponenten-Grenze hinweg fuer eine 8-Zeilen-Funktion.
// Bugfix (Nutzer-Feedback: "auf den Handys nur diesen Siegel drauf, gar
// nicht so wie bei dieser Beispiel-Seite" — Referenz thedigitalyes.com,
// deren Handy-Mockup eine echte fotografierte/texturierte Flaeche zeigt,
// nicht nur ein Siegel auf einfarbigem Grund): nutzt das ohnehin schon
// lizenzierte Vorlagenfoto (PHOTO_BACKGROUND) bzw. bei den 15 Duegduen-
// Blanko-Vorlagen deren eigene Kartengrafik (cardImageUrl) als Flatlay-
// Oberflaeche hinter dem Siegel — kein neuer Envato-Einkauf noetig, jede
// Vorlage bekommt trotzdem eine zu ihr passende, einzigartige Flaeche
// statt des vorherigen einfarbigen Verlaufs.
export function phoneBackgroundPhoto(item: { cardImageUrl?: string | null; photoBackground?: { src: string } | null }): string | null {
  return item.cardImageUrl ?? item.photoBackground?.src ?? null;
}

export function sealForBackground(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const isLight = !m || (() => {
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  })();
  return isLight ? "/assets/seals/wax-seal-dark.png" : "/assets/seals/wax-seal-light.png";
}

function TemplateCard({ item, index, paket, accentColor }: { item: GalleryCategoryItem; index: number; paket?: string; accentColor?: string }) {
  const href = paket ? `/gestalten/${item.id}?paket=${paket}` : `/gestalten/${item.id}`;
  const sealSrc = sealForBackground(item.colors.background);
  const phonePhoto = phoneBackgroundPhoto(item);
  return (
    <MotionLink
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => handleOpenClick(e, href)}
      className="tpl"
      layout
      custom={index}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={cardVariants}
      style={
        {
          "--tpl-rotate": `${tiltForId(item.id)}deg`,
          "--tpl-aspect": formatForId(item.id),
          "--tpl-accent": accentColor,
        } as CSSProperties
      }
    >
      <span className="tpl-open-hint">Design anpassen</span>
      {/* docs/MOTION.md §3 (Referenz-Studie thedigitalyes.com): Handy-
          Mockup mit geschlossenem Umschlag + Wachssiegel links, geoeffnete
          Karten-Vorschau rechts — Flatlay-Produktfoto-Komposition statt
          einer einzelnen flachen Bildkachel. */}
      <div className="tpl-flatlay">
        <div
          className="tpl-phone"
          style={{
            backgroundImage: phonePhoto
              ? `linear-gradient(135deg, ${item.colors.background}d9, ${item.colors.accent}a6), url(${phonePhoto})`
              : `linear-gradient(135deg, ${item.colors.background}, ${item.colors.accent}33)`,
          }}
        >
          <span className="tpl-phone-notch" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element -- kleines statisches Deko-Asset */}
          <img className="tpl-phone-seal" src={sealSrc} alt="" />
        </div>
        <div className="tpl-card-slot">
          <div className="tpl-media">
            <TemplatePreview layoutKey={item.layoutKey} />
            <span className="tpl-flap" aria-hidden="true" />
            <span className="tpl-frame" aria-hidden="true" />
          </div>
        </div>
      </div>
      <span className="tpl-label">
        <span>{item.name}</span>
        {item.priceCents > 0 && <span className="tpl-price">{eur.format(item.priceCents / 100)}</span>}
      </span>
    </MotionLink>
  );
}

type GalleryCategoryItem = GalleryCategory["items"][number];

// Reines Kachel-Raster ohne eigenen Client-State — Klick auf eine Vorlage
// fuehrt auf die dedizierte Design-Studio-Seite (/gestalten/[id]) statt ein
// Overlay auf der Startseite zu oeffnen. Der kleine, feste Overlay-Ausschnitt
// war auf schmaleren Fensterbreiten zu eng fuer Kartenvorschau + Optionen
// gleichzeitig — eine eigene Seite hat den ganzen Viewport zur Verfuegung.
export function TemplateGallery({
  categories,
  locale,
  paket,
  accentColor,
}: {
  categories: GalleryCategory[];
  locale: Locale;
  // Startseiten-Paket-CTA (Schritt 4) — reicht das per Klick gewaehlte
  // Paket (packageSlug, z.B. "vip") an jede Vorlage weiter, damit
  // /gestalten/[id]?paket=... beim Öffnen direkt den richtigen
  // Funktionsumfang vorauswaehlt statt pauschal Premium Plus.
  paket?: string;
  // Zweig-Farbe (Tuerkisch/Deutsch, siehe VorlagenGallery.tsx) fuer den
  // Rahmen-Reveal beim Hover — faellt ohne Angabe auf --zc-accent zurueck.
  accentColor?: string;
}) {
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
          <div className="cat-head reveal">
            <h3>{categoryLabel(category, locale)}</h3>
            <span className="cat-sub">{subtitle}</span>
          </div>
          <AnimatePresence>
            <div className="cat-grid vg-masonry">
              {items.map((item, i) => (
                <TemplateCard key={item.id} item={item} index={i} paket={paket} accentColor={accentColor} />
              ))}
            </div>
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}
