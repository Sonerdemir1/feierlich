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
  // Einladender Standard-Beschreibungstext (2-3 Zeilen) zwischen Namen und
  // Datum/Ort auf der Karte — fuellt sonst leeren Raum bei Vorlagen mit
  // fester Kartengrafik (siehe DesignStudio.tsx renderDescription) und gibt
  // jeder Kategorie einen zur Sprache/Kultur passenden Vorschlag statt
  // eines leeren Feldes.
  defaultDescription: string;
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

// Analog zu defaultTextForCategory/defaultEventLabelForCategory oben —
// Tuerkische Kategorien bekommen tuerkischen Text (Zielgruppe: tuerkisch-/
// kurdischstaemmige Hochzeitssaal-Kunden), die uebrigen (deutschsprachigen)
// Stil-Kategorien einen passenden deutschen Text.
export function defaultDescriptionForCategory(category: string): string {
  if (category === "Düğün") return "Sevginin ve mutluluğun en güzel yolculuğuna sizleri de ortak etmek istiyoruz.";
  if (category === "Kına Gecesi") return "Kınamızın neşesini, dualarımızı ve sevincimizi sizlerle paylaşmak istiyoruz.";
  if (category === "Nişan") return "Birbirimize söz verdiğimiz bu özel günde, sevdiklerimizin yanımızda olmasını istiyoruz.";
  if (category === "Sünnet") return "Bu özel günün mutluluğunu ve duamızı sizlerle paylaşmak istiyoruz.";
  if (category === "Verspielt") return "Wir feiern einen ganz besonderen Tag und würden uns riesig freuen, ihn gemeinsam mit euch zu erleben.";
  if (category === "Business Modern") return "Wir laden Sie herzlich ein, gemeinsam mit uns auf ein erfolgreiches Jahr zurückzublicken und anzustoßen.";
  return "Wir möchten diesen besonderen Tag mit den Menschen feiern, die uns am wichtigsten sind — wir freuen uns auf euch.";
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
  // Erste echte, eigene Fotos je Vorlage statt Wiederverwendung desselben
  // Musters (siehe Plan-Phase E) — diese drei Düğün-Vorlagen hatten zuvor
  // ueberhaupt kein Foto (nur den SVG-Ornament-Rahmen), obwohl sie extra
  // fuer ein Foto gebaut wurden ("Foto + Eck-Ornament-Rahmen", siehe
  // seed.ts-Kommentar). Lizenzfrei ueber das bestehende Envato-Elements-Abo
  // bezogen (kommerzielle Lizenz), auf ~1400px Langkante verkleinert.
  "dugun-foto-elmas": { src: "/images/templates/palace-ballroom-gold.jpg", tint: "250,243,228" },
  "dugun-foto-zumrut": { src: "/images/templates/malachite-emerald-gold.jpg", tint: "11,42,30" },
  "dugun-foto-yakut": { src: "/images/templates/red-roses-candlelight.jpg", tint: "246,236,217" },
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
  // Zweite Foto-Beschaffungsrunde (Plan-Phase E, Fortsetzung) — schliesst
  // die restlichen tuerkischen Kategorien (Kına Gecesi, Nişan, Sünnet) ab,
  // die bisher nur je eine von drei Vorlagen mit Foto hatten. Tint jeweils
  // die eigene "background"-Vorlagenfarbe aus seed.ts, als r,g,b.
  "oya-lace": { src: "/images/templates/oya-lace.jpg", tint: "250,246,239" },
  "nar-cicegi": { src: "/images/templates/nar-cicegi.jpg", tint: "247,227,217" },
  "soz-guemuesue": { src: "/images/templates/soz-guemuesue.jpg", tint: "251,234,238" },
  "gul-bahcesi": { src: "/images/templates/gul-bahcesi.jpg", tint: "251,239,234" },
  masmavi: { src: "/images/templates/masmavi.jpg", tint: "234,241,248" },
  // Dritte Foto-Beschaffungsrunde (Plan-Phase E, Abschluss) — die restlichen
  // 20 deutschsprachigen Vorlagen (Zeitlos/Botanisch/Romantisch/Statement/
  // Verspielt/Business Modern), die bisher auf den Farbverlauf-Fallback
  // zurueckfielen. Tint jeweils die eigene "background"-Vorlagenfarbe aus
  // seed.ts, als r,g,b.
  "mono-editorial": { src: "/images/templates/mono-editorial.jpg", tint: "250,246,239" },
  letterpress: { src: "/images/templates/letterpress.jpg", tint: "250,246,239" },
  "papier-weiss": { src: "/images/templates/papier-weiss.jpg", tint: "255,255,255" },
  sandstein: { src: "/images/templates/sandstein.jpg", tint: "239,231,216" },
  "terracotta-bloom": { src: "/images/templates/terracotta-bloom.jpg", tint: "178,84,58" },
  olivenzweig: { src: "/images/templates/olivenzweig.jpg", tint: "237,239,225" },
  eukalyptus: { src: "/images/templates/eukalyptus.jpg", tint: "238,242,233" },
  wildblume: { src: "/images/templates/wildblume.jpg", tint: "251,241,228" },
  rosenquarz: { src: "/images/templates/rosenquarz.jpg", tint: "245,225,222" },
  liebesbrief: { src: "/images/templates/liebesbrief.jpg", tint: "243,236,223" },
  pfingstrose: { src: "/images/templates/pfingstrose.jpg", tint: "251,238,241" },
  champagner: { src: "/images/templates/champagner.jpg", tint: "250,243,230" },
  onyx: { src: "/images/templates/onyx.jpg", tint: "22,19,15" },
  kupferglanz: { src: "/images/templates/kupferglanz.jpg", tint: "166,81,46" },
  mitternacht: { src: "/images/templates/mitternacht.jpg", tint: "16,19,31" },
  bordeaux: { src: "/images/templates/bordeaux.jpg", tint: "43,16,20" },
  zuckerwatte: { src: "/images/templates/zuckerwatte.jpg", tint: "251,239,246" },
  pastellwiese: { src: "/images/templates/pastellwiese.jpg", tint: "234,246,238" },
  graphit: { src: "/images/templates/graphit.jpg", tint: "30,35,40" },
  "minz-corporate": { src: "/images/templates/minz-corporate.jpg", tint: "240,247,244" },
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

// Tuerkische Buchstaben (ı, ğ, ş, ç, ö, ü) haben keine NFKD-Zerlegung in
// Basisbuchstabe+Akzent wie z.B. "é" — normalize("NFKD") liess sie bisher
// unveraendert durch, wodurch sie beim anschliessenden [^a-z0-9]-Ersetzen als
// Sonderzeichen behandelt wurden ("Kına Gecesi" -> "cat-k-na-gecesi" statt
// "cat-kina-gecesi"). Funktional unschaedlich (Pill-Link und Sektions-ID
// nutzen dieselbe Funktion, bleiben also immer konsistent), aber unschoen in
// URL/DOM. Explizite Zeichentabelle vor der generischen NFKD-Behandlung.
const TURKISH_CHAR_MAP: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ç: "c", Ç: "c", ö: "o", Ö: "o", ü: "u", Ü: "u",
};
export function categorySlug(category: string): string {
  return category
    .split("")
    .map((ch) => TURKISH_CHAR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
