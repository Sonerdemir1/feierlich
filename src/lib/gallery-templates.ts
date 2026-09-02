import type { Locale } from "@/lib/i18n";

// Reine Typen + Anzeige-Helfer, OHNE Prisma-Import — dieses Modul wird auch
// von Client-Komponenten (DesignStudio.tsx) importiert, ein Prisma-Import
// hier wuerde `pg` in den Browser-Bundle ziehen und den Build brechen. Die
// eigentliche DB-Abfrage (getGalleryCategories) liegt getrennt in
// gallery-templates-data.ts, das nur von Server-Components importiert wird.

export type Colors = { primary: string; accent: string; background: string };

export type GalleryTemplate = {
  id: string;
  name: string;
  layoutKey: string;
  priceCents: number;
  colors: Colors;
  defaultText: string;
  defaultEventLabel: string;
  photoBackground: { src: string; tint: string } | null;
  // Echtes Kartendesign (Template.previewUrl) — wenn gesetzt, zeigt der
  // Customizer das Kartenbild statt des generischen CSS-Rahmens, analog
  // zur echten Event-Seite (/e/[slug]).
  cardImageUrl: string | null;
};

export type GalleryCategory = {
  category: string;
  subtitle: string;
  items: GalleryTemplate[];
};

export const TURKISH_CATEGORIES = new Set(["Düğün", "Kına Gecesi", "Nişan", "Sünnet"]);

export function defaultTextForCategory(category: string): string {
  if (TURKISH_CATEGORIES.has(category)) return "Ayşe & Emre";
  if (category === "Verspielt") return "Mia wird 5";
  if (category === "Business Modern") return "Jahresempfang 2026";
  return "Anna & Lukas";
}

export function defaultEventLabelForCategory(category: string): string {
  if (category === "Düğün") return "DÜĞÜN DAVETİYESİ";
  if (category === "Kına Gecesi") return "KINA GECESİ";
  if (category === "Nişan") return "NİŞAN DAVETİYESİ";
  if (category === "Sünnet") return "SÜNNET DAVETİYESİ";
  if (category === "Verspielt") return "GEBURTSTAGSPARTY";
  if (category === "Business Modern") return "JAHRESEMPFANG";
  return "HOCHZEITSEINLADUNG";
}

// Lizenzfreie Foto-Hintergruende (Pexels-Lizenz, kommerziell nutzbar ohne
// Zuschreibung) je layoutKey. `tint` ist die Vorlagenfarbe als "r,g,b" —
// der dunkle Verlauf ueber dem Foto wird daraus gebaut, damit Bosporus-
// Nachtfoto und Iznik-Fliesenmuster farblich zur jeweiligen Vorlage passen
// statt immer denselben Ton zu haben.
export const PHOTO_BACKGROUND: Record<string, { src: string; tint: string }> = {
  "kina-kirmizi": { src: "/images/templates/iznik-floral.jpg", tint: "122,20,40" },
  "kraliyet-moru": { src: "/images/templates/iznik-floral.jpg", tint: "46,26,71" },
  // Sünnet zeigt keine echten Zeremonie-Fotos (Kinder) — stattdessen dasselbe
  // Iznik-Fliesenmuster wie Kına/Nişan, nur blau statt rot/lila getönt.
  "sehzade-mavisi": { src: "/images/templates/iznik-floral.jpg", tint: "14,47,90" },
  "minimal-ivory": { src: "/images/templates/wedding-aisle-classic.jpg", tint: "250,246,239" },
  botanico: { src: "/images/templates/fern-greenery.jpg", tint: "243,236,223" },
  "roman-script": { src: "/images/templates/rose-tulip-bouquet.jpg", tint: "240,217,204" },
  "gold-line": { src: "/images/templates/grand-hall-dramatic.jpg", tint: "33,28,25" },
  konfetti: { src: "/images/templates/party-balloons.jpg", tint: "255,244,227" },
  klarblau: { src: "/images/templates/modern-lounge-warm.jpg", tint: "22,35,59" },
};

export const CATEGORY_SUBTITLE: Record<string, string> = {
  Zeitlos: "Klar, reduziert, langlebig",
  Botanisch: "Zarte Linien, natürliche Formen",
  Romantisch: "Weich, fließend, persönlich",
  Statement: "Dunkel, klar, selbstbewusst",
  Düğün: "Für den großen Tag – opulent oder elegant",
  "Kına Gecesi": "Für die Henna-Nacht – opulent oder elegant",
  Nişan: "Für die Verlobung – opulent oder elegant",
  Sünnet: "Für das Fest – opulent oder elegant",
  Verspielt: "Fröhlich, bunt, verspielt",
  "Business Modern": "Klar, professionell, zeitgemäß",
};

// Die Kategorie selbst bleibt ueberall (DB, Anker-IDs, Gruppierung) der
// tuerkische Name — das ist der Fachbegriff, den die Zielgruppe (tuerkisch-
// /kurdischstaemmige Hochzeitssaal-Kunden) kennt und sucht. Nur die
// ANZEIGE uebersetzt sich mit dem Sprachumschalter: bei "Deutsch"
// eingestellt darf keine Kachel unuebersetzt tuerkisch stehenbleiben,
// sonst wirkt der Umschalter kaputt/halbfertig. Deutsche Begriffe
// uebernommen aus den bereits vorhandenen CATEGORY_SUBTITLE-Texten oben
// ("Henna-Nacht", "Verlobung"), Sünnet/Düğün ergaenzt.
const CATEGORY_LABEL_DE: Record<string, string> = {
  Düğün: "Hochzeit",
  "Kına Gecesi": "Henna-Nacht",
  Nişan: "Verlobung",
  Sünnet: "Beschneidungsfest",
};

export function categoryLabel(category: string, locale: Locale): string {
  if (locale === "de") return CATEGORY_LABEL_DE[category] ?? category;
  return category;
}

// Muss exakt zur gleichnamigen Funktion in TemplateGallery.tsx/DesignStudio.tsx
// passen (erzeugen dieselben Anker-IDs) — bewusst dupliziert statt geteilt,
// gleiches Muster wie die anderen lokalen `slugify`-Helfer im Projekt.
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
