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
// Redesign Nr. 2 (Nutzer-Feedback, woertlich: "allein der Umschlag ist ja
// schon haesslich... sieht aus wie eine billige, cleane Wand... oben das
// Dreieck ist nur ein bisschen dunkler"): die erste Fassung hier nutzte
// noch das Vorlagenfoto/die Kartengrafik als Handy-Flaeche (siehe Git-
// Historie) — sichtbar besser als reine Farbe, aber immer noch kein
// "Stoff"-Eindruck. Jetzt: eine von 7 KI-generierten Umschlag-Material-
// Aufnahmen (gefaltete Seide/Samt/Leinen + Wachssiegel, siehe
// public/assets/envelope-materials/ und docs/asset-register.md) wird
// anhand der Vorlagenfarbe ausgewaehlt — dieselbe Funktion versorgt sowohl
// das Handy-Mockup (hier/CuratedTemplates.tsx) als auch den echten
// Umschlag selbst (EnvelopeOpen.tsx), damit Katalog-Vorschau und
// tatsaechliche Oeffnung zueinander passen (CLAUDE.md Regel 6).
// Bugfix (Nutzer-Feedback, woertlich: "da sind ueberall auf den Smartphones
// die gleichen Siegel drauf... kein geiles Design"): jedes generierte Foto
// hat eigentlich ein EIGENES, einzigartiges Siegel eingebacken (Teil des
// KI-Prompts) — vorher wurde genau dieser Bereich per background-position
// bewusst weggeschnitten und stattdessen ueberall dasselbe generische
// wax-seal-dark/light.png druebergelegt (siehe Git-Historie). Jetzt: ein
// mit sips zentriert zugeschnittener 420×420-Ausschnitt genau um das
// eingebackene Siegel jedes Fotos (public/assets/envelope-materials/
// seals/) ersetzt das generische Icon — 7 echte, unterschiedliche Siegel
// statt 2 generischer Varianten.
// `tint` = Signalfarbe der Material-Familie (Nutzer-Feedback, woertlich:
// "die Karten passen ja nicht wirklich dazu... wenn du da ein dunkelblau
// nimmst, dann muss die Karte auch dazu passen"): das Umschlag-Material
// kann kraeftig sein (Marineblau-Samt etc.), waehrend die Karte dahinter
// oft einen neutralen cremefarbenen Hintergrund hat (eigene Design-
// Entscheidung der Vorlage) — ohne Uebergang wirkt das wie ein Bruch.
// EnvelopeOpen.tsx nutzt `tint`, um direkt am Oeffnungs-Nahtpunkt einen
// weichen Farbverlauf in derselben Familie einzublenden, der in die Karte
// hineinlaeuft — kein Umbau der Kartenfarben selbst (die bleiben die
// eigentliche Vorlagen-Gestaltung), nur ein optischer Handoff.
const ENVELOPE_MATERIALS = {
  "ivory-gold": { photo: "/assets/envelope-materials/ivory-gold.jpg", seal: "/assets/envelope-materials/seals/ivory-gold.jpg", tint: "#C9A227" },
  "emerald-gold": { photo: "/assets/envelope-materials/emerald-gold.jpg", seal: "/assets/envelope-materials/seals/emerald-gold.jpg", tint: "#1B5E3C" },
  "bordeaux-gold": { photo: "/assets/envelope-materials/bordeaux-gold.jpg", seal: "/assets/envelope-materials/seals/bordeaux-gold.jpg", tint: "#6B1420" },
  "navy-gold": { photo: "/assets/envelope-materials/navy-gold.jpg", seal: "/assets/envelope-materials/seals/navy-gold.jpg", tint: "#16213E" },
  "blush-rosegold": { photo: "/assets/envelope-materials/blush-rosegold.jpg", seal: "/assets/envelope-materials/seals/blush-rosegold.jpg", tint: "#C98E92" },
  "terracotta-botanical": { photo: "/assets/envelope-materials/terracotta-botanical.jpg", seal: "/assets/envelope-materials/seals/terracotta-botanical.jpg", tint: "#B2543A" },
  "onyx-gold": { photo: "/assets/envelope-materials/onyx-gold.jpg", seal: "/assets/envelope-materials/seals/onyx-gold.jpg", tint: "#2A241C" },
} as const;

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

// Bugfix (live getestet: "Lacivert Kemer" — Navy im Namen — bekam dasselbe
// Material wie drei andere, komplett andersfarbige Vorlagen): HSL-Saettigung
// allein ist bei fast-weissen/fast-schwarzen Farben irrefuehrend — ein
// cremefarbener Hintergrund wie #F5EDDC errechnet ueber die Standard-HSL-
// Formel ~56% Saettigung, obwohl er optisch neutral wirkt, und gewann so
// faelschlich gegen die tatsaechlich bunte Navy-Primaerfarbe. effectiveS
// daempft die Saettigung mit dem Abstand von der Mitte (l=0.5) — Farben
// nahe Weiss/Schwarz zaehlen kaum noch, auch wenn ihr roher s-Wert hoch ist.
function effectiveSaturation(c: { s: number; l: number }): number {
  return c.s * (1 - Math.abs(c.l - 0.5) * 2);
}

// Nimmt die Farbe mit der hoeheren (effektiven) Saettigung aus Hintergrund/
// Primaer als "Identitaetsfarbe" der Vorlage — viele Duegduen-Vorlagen haben
// einen cremefarben-neutralen Hintergrund, die eigentliche Signalfarbe
// (Bordeaux, Lacivert, Zuemrut...) steckt im primary-Text, nicht im
// Hintergrund.
export function envelopeMaterialFor(colors: { background: string; accent?: string; primary: string }): { photo: string; seal: string; tint: string } {
  const bg = hexToHsl(colors.background);
  const pr = hexToHsl(colors.primary);
  const pick = bg && pr ? (effectiveSaturation(bg) >= effectiveSaturation(pr) ? bg : pr) : (bg ?? pr);
  if (!pick) return ENVELOPE_MATERIALS["ivory-gold"];
  const { h, l } = pick;
  const s = effectiveSaturation(pick);
  if (s < 0.14) return l > 0.55 ? ENVELOPE_MATERIALS["ivory-gold"] : ENVELOPE_MATERIALS["onyx-gold"];
  if (h >= 340 || h < 14) return ENVELOPE_MATERIALS["bordeaux-gold"];
  if (h < 42) return ENVELOPE_MATERIALS["terracotta-botanical"];
  if (h < 68) return ENVELOPE_MATERIALS["ivory-gold"];
  if (h < 168) return l > 0.5 ? ENVELOPE_MATERIALS["terracotta-botanical"] : ENVELOPE_MATERIALS["emerald-gold"];
  if (h < 258) return ENVELOPE_MATERIALS["navy-gold"];
  return ENVELOPE_MATERIALS["blush-rosegold"];
}

function TemplateCard({ item, index, paket, accentColor }: { item: GalleryCategoryItem; index: number; paket?: string; accentColor?: string }) {
  const href = paket ? `/gestalten/${item.id}?paket=${paket}` : `/gestalten/${item.id}`;
  const material = envelopeMaterialFor(item.colors);
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
          style={{ backgroundImage: `linear-gradient(135deg, ${item.colors.background}40, ${item.colors.accent}26), url(${material.photo})` }}
        >
          <span className="tpl-phone-notch" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element -- kleines statisches Deko-Asset */}
          <img className="tpl-phone-seal" src={material.seal} alt="" />
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
