"use client";

import { Fragment, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TemplatePreview, CornerMotif, DotScatter, NazarScatter } from "@/components/marketing/TemplatePreview";
import { FONT_OPTIONS } from "@/lib/fonts";
import { cardTextZone } from "@/lib/card-frames";
import { categoryLabel, type GalleryTemplate } from "@/lib/gallery-templates";
import type { Locale } from "@/lib/i18n";
import { packageSlug } from "@/lib/packages";
import { ContextPanel } from "@/components/editor/ContextPanel";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { TextControls } from "@/components/editor/TextControls";
import { DateQuickEdit } from "@/components/editor/DateQuickEdit";
import { FontPicker } from "@/components/editor/FontPicker";
import { InlineEditableField } from "@/components/public/InlineEditableField";
import { SectionsList } from "@/components/dashboard/panels/SectionsList";
import { elementOverrideStyle, TEXT_ELEMENT_LABELS, type StyleElements, type TextElementKey, type TextElementStyle } from "@/lib/text-style";

type PhotoShape = "rect" | "circle" | "star" | "polaroid";

const PHOTO_SHAPES: { id: PhotoShape; label: string }[] = [
  { id: "polaroid", label: "Polaroid" },
  { id: "rect", label: "Rechteck" },
  { id: "circle", label: "Kreis" },
  { id: "star", label: "Stern" },
];

const STAR_CLIP = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";

function photoStyle(shape: PhotoShape): CSSProperties {
  switch (shape) {
    case "circle":
      return { width: "52%", aspectRatio: "1", borderRadius: "50%", objectFit: "cover" };
    case "star":
      return { width: "58%", aspectRatio: "1", objectFit: "cover", clipPath: STAR_CLIP };
    case "polaroid":
      return {
        width: "68%",
        aspectRatio: "4 / 3",
        objectFit: "cover",
        border: "8px solid #FAF6EF",
        borderBottom: "22px solid #FAF6EF",
        boxShadow: "0 10px 20px rgba(0,0,0,0.28)",
        transform: "rotate(-2deg)",
      };
    default:
      return { width: "80%", aspectRatio: "4 / 3", objectFit: "cover" };
  }
}

type Draft = {
  text: string;
  eventLabel: string;
  // Ersetzt das fruehere freie Textfeld "dateText" — ein echtes Datum wird
  // fuer die Klick-Bearbeitung ueber DateQuickEdit UND fuer die spaetere
  // Umwandlung in ein echtes Event.eventDate gebraucht (siehe apply-draft).
  eventDate: string; // "YYYY-MM-DD" oder "" (noch nicht gesetzt)
  eventTime: string; // "HH:MM" oder ""
  locationText: string;
  familyLeft: string;
  familyRight: string;
  fontId: string;
  fontSize: number;
  primary: string;
  accent: string;
  background: string;
  image: string | null;
  photoShape: PhotoShape;
  showFloral: boolean;
  showOrnaments: boolean;
  showCountdown: boolean;
  showRsvp: boolean;
  showSeating: boolean;
  showGallery: boolean;
  showPhotoBackground: boolean;
  extraFeatures: Record<string, boolean>;
  // Reihenfolge aller 14 umschaltbaren Kartenabschnitte (4 Kern-Keys +
  // EXTRA_FEATURES-Keys) — steuert die Renderreihenfolge in der Karte.
  sectionOrder: string[];
  // Pro-Element Groesse/Ausrichtung/Farbe/Stil/Schriftart — dieselbe Struktur
  // wie im Dashboard-Editor (src/lib/text-style.ts), damit TextControls.tsx
  // unveraendert wiederverwendet werden kann.
  elements?: StyleElements;
};

// Welches Paket ein Feature freischaltet — aus prisma/seed.ts (Package.
// features, ueber alle fuenf Pakete hinweg das jeweils guenstigste, das
// es enthaelt) uebernommen, damit die Anzeige hier nicht aus der Luft
// gegriffen ist. Bei Aenderungen an den Paketen auch hier nachziehen.
const FEATURE_TIER: Record<string, string> = {
  countdown: "Basic",
  agenda: "Premium",
  rsvp: "Premium",
  seating: "Premium Plus",
  gallery: "Premium Plus",
  guestbook: "Premium Plus",
  dresscode: "VIP",
  "social-media": "VIP",
  menu: "VIP",
  wishlist: "VIP",
  "music-requests": "VIP",
  "thank-you-card": "VIP",
  "audio-invitation": "VIP",
  "video-invitation": "VIP",
};

// Preise der Pakete, die die Tiers oben freischalten (aus prisma/seed.ts,
// gleiches Wartungsmuster wie FEATURE_TIER) — der Kunde soll beim Anhaken
// direkt sehen, was ihn das kostet, statt nur einen Tier-Namen ohne Preis.
const TIER_PRICE: Record<string, number> = {
  Basic: 4900,
  Premium: 9900,
  "Premium Plus": 14900,
  VIP: 29900,
};
const TIER_ORDER = ["Basic", "Premium", "Premium Plus", "VIP"];

// Fuer den "Details ->"-Link im Funktionen-Tab, der auf die bestehende
// Preisseite verlinkt (src/app/preise/[key]/page.tsx) statt Preisabsaetze
// direkt im Editor zu zeigen.
const PACKAGE_KEY_BY_TIER: Record<string, string> = {
  Basic: "BASIC",
  Premium: "PREMIUM",
  "Premium Plus": "PREMIUM_PLUS",
  VIP: "VIP",
};

const PANEL_TABS = [
  { id: "design", label: "Design" },
  { id: "funktionen", label: "Funktionen" },
];

// Kurzbeschreibung je Kern-Funktion — direkt aus den Modul-Beschreibungen
// in prisma/seed.ts uebernommen (gleiches Wartungsmuster wie FEATURE_TIER),
// damit der Kunde beim Toggle versteht, was er da anschaltet, statt nur
// einen Feature-Namen ohne Kontext zu sehen.
const CORE_FEATURE_DESCRIPTIONS: Record<string, string> = {
  countdown: "Countdown-Timer bis zum Event auf der Einladungsseite.",
  rsvp: "Gäste sagen online direkt zu oder ab — inklusive Personenanzahl und Nachricht an euch.",
  seating: "Gäste finden ihren Tisch per Namenssuche.",
  gallery: "Gäste laden eigene Fotos/Videos hoch, die in einer gemeinsamen Galerie erscheinen.",
};

// Zusaetzliche Funktionen, kompakt als Toggle-Liste statt als eigene grosse
// Kartenabschnitte — sonst waechst die Karte ins Unendliche. Countdown,
// Zusagen, Sitzplan und Galerie bleiben die einzigen mit eigenem grossen
// Vorschau-Block, weil sie die auffaelligsten/haeufigsten sind.
const EXTRA_FEATURES: { key: string; label: string; description: string }[] = [
  { key: "agenda", label: "Ablaufplan", description: "Zeitlicher Ablauf des Events, z. B. Sektempfang, Trauung, Feier." },
  { key: "guestbook", label: "Gästebuch", description: "Gäste hinterlassen Text- oder Videonachrichten für euch." },
  { key: "dresscode", label: "Dresscode", description: "Hinweis zum gewünschten Dresscode für die Gäste." },
  { key: "social-media", label: "Social Media", description: "Hashtag-Hinweis, damit ihr die Gäste-Posts wiederfindet." },
  { key: "menu", label: "Digitale Menükarte", description: "Menüauswahl, die Gäste direkt bei der Zusage mit angeben." },
  { key: "wishlist", label: "Wunschliste", description: "Geschenkewunschliste für die Gäste." },
  { key: "music-requests", label: "Musikwünsche", description: "Gäste reichen Musikwünsche für die Feier ein." },
  { key: "thank-you-card", label: "Digitale Dankeskarte", description: "Erscheint automatisch für eure Gäste, sobald das Event vorbei ist." },
  { key: "audio-invitation", label: "Audio-Einladung", description: "Sprachnachricht als persönliche Einladung." },
  { key: "video-invitation", label: "Video-Einladung", description: "Videobotschaft als persönliche Einladung." },
];

// Default-Reihenfolge aller 14 umschaltbaren Kartenabschnitte — deckt sich
// mit der bisherigen fest kodierten Render-Reihenfolge (Countdown -> RSVP ->
// Sitzplan -> Galerie), die EXTRA_FEATURES kommen in ihrer bisherigen
// Anzeige-Reihenfolge danach.
const CORE_SECTION_KEYS = ["countdown", "rsvp", "seating", "gallery"];
const DEFAULT_SECTION_ORDER = [...CORE_SECTION_KEYS, ...EXTRA_FEATURES.map((f) => f.key)];

const STORAGE_KEY = "einladi:design-drafts:v1";
// Der exakt gleiche String-Wert wird in ApplyPendingDraft.tsx bewusst
// dupliziert statt von hier importiert, damit der winzige Dashboard-
// Baustein nicht das ganze DesignStudio-Modul mitziehen muss — siehe
// Kommentar dort.
export const PENDING_DRAFT_KEY = "einladi:pending-draft-template-id";
const MAX_IMAGE_BYTES = 2_500_000;

function loadDrafts(): Record<string, Draft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function defaultDraft(item: GalleryTemplate): Draft {
  return {
    text: item.defaultText,
    eventLabel: item.defaultEventLabel,
    eventDate: "",
    eventTime: "",
    locationText: "",
    familyLeft: "",
    familyRight: "",
    fontId: "cormorant",
    fontSize: 26,
    primary: item.colors.primary,
    accent: item.colors.accent,
    background: item.colors.background,
    image: null,
    photoShape: "polaroid",
    showFloral: true,
    showOrnaments: true,
    showCountdown: true,
    showRsvp: true,
    showSeating: true,
    showGallery: true,
    showPhotoBackground: true,
    extraFeatures: Object.fromEntries(EXTRA_FEATURES.map((f) => [f.key, true])),
    sectionOrder: DEFAULT_SECTION_ORDER,
  };
}

function saveDrafts(drafts: Record<string, Draft>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // localStorage voll oder deaktiviert — Entwurf bleibt nur im Speicher dieser Sitzung.
  }
}

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export type AltDesign = { id: string; name: string; layoutKey: string };

export function DesignStudio({
  item,
  category,
  locale,
  prevId,
  nextId,
  otherInCategory,
}: {
  item: GalleryTemplate;
  category: string;
  locale: Locale;
  prevId: string | null;
  nextId: string | null;
  otherInCategory: AltDesign[];
}) {
  const router = useRouter();
  // `category` bleibt intern der tuerkische Rohwert (Anker-Logik, Sünnet-
  // Nazar-Check unten) — nur die Anzeige uebersetzt sich mit der Sprache.
  const categoryDisplay = categoryLabel(category, locale);
  // Lazy initializer statt Effect: laeuft einmalig bei Mount, liest sicher
  // {} waehrend SSR (loadDrafts prueft `typeof window`).
  const [drafts, setDrafts] = useState<Record<string, Draft>>(loadDrafts);
  const [savedHint, setSavedHint] = useState(false);
  const [activeTab, setActiveTab] = useState("design");
  const [selectedKey, setSelectedKey] = useState<TextElementKey | undefined>(undefined);

  // Merge statt reinem Fallback: ein in localStorage gespeicherter Entwurf
  // aus einer aelteren Version (vor neuen Draft-Feldern) soll die neuen
  // Felder aus dem Default ziehen, nicht stillschweigend als "aus" gelten.
  function mergedDraft(saved?: Draft): Draft {
    const base = defaultDraft(item);
    if (!saved) return base;
    // sectionOrder haengt in ihrer Reihenfolge vom gespeicherten Draft ab,
    // aber falls seither neue Abschnitts-Keys hinzukamen (z.B. nach einem
    // Feature-Release), werden die hinten angehaengt statt zu fehlen.
    const savedOrder = saved.sectionOrder ?? base.sectionOrder;
    const sectionOrder = [...savedOrder, ...base.sectionOrder.filter((k) => !savedOrder.includes(k))];
    return { ...base, ...saved, extraFeatures: { ...base.extraFeatures, ...saved.extraFeatures }, sectionOrder };
  }

  const draft = mergedDraft(drafts[item.id]);

  function updateDraft(patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = mergedDraft(prev[item.id]);
      const next = { ...prev, [item.id]: { ...base, ...patch } };
      saveDrafts(next);
      return next;
    });
    setSavedHint(false);
  }

  // Formatiert eventDate/eventTime fuers Karten-Display — gleiche
  // Darstellung wie im Dashboard-Editor (HeroCard.tsx `dateText`), damit
  // Vorschau hier und echte Kartenausgabe spaeter identisch aussehen.
  function draftDateText(): string {
    if (!draft.eventDate) return "";
    const formatted = new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(draft.eventDate));
    return draft.eventTime ? `${formatted} · ${draft.eventTime} Uhr` : formatted;
  }

  function updateElementStyle(key: TextElementKey, patch: Partial<TextElementStyle>) {
    updateDraft({ elements: { ...draft.elements, [key]: { ...draft.elements?.[key], ...patch } } });
  }

  // Kleine Render-Helfer statt doppelt kopierter Klick-Auswahl-Logik in den
  // beiden Karten-Layouts (mit/ohne Kartengrafik) — gleiches Muster wie
  // renderEventLabel/renderTitle/renderFamily in HeroCard.tsx.
  function renderEventLabel(style: CSSProperties) {
    const override = elementOverrideStyle(draft.elements, "eventLabel");
    return (
      <SelectableElement kind="text" label="Anlass-Label" selected={selectedKey === "eventLabel"} onSelect={() => setSelectedKey("eventLabel")}>
        <InlineEditableField
          value={draft.eventLabel}
          onChange={(text) => updateDraft({ eventLabel: text })}
          placeholder={item.defaultEventLabel}
          onFocus={() => setSelectedKey("eventLabel")}
          style={{ ...style, ...override }}
        />
      </SelectableElement>
    );
  }

  function renderTitle(style: CSSProperties) {
    const override = elementOverrideStyle(draft.elements, "title");
    return (
      <SelectableElement kind="text" label="Name / Titel" selected={selectedKey === "title"} onSelect={() => setSelectedKey("title")}>
        <InlineEditableField
          value={draft.text}
          onChange={(text) => updateDraft({ text })}
          placeholder={item.defaultText}
          onFocus={() => setSelectedKey("title")}
          style={{ ...style, ...override }}
        />
      </SelectableElement>
    );
  }

  function renderFamily(containerStyle: CSSProperties) {
    if (!draft.familyLeft && !draft.familyRight) return null;
    const override = elementOverrideStyle(draft.elements, "family");
    const nameStyle: CSSProperties = { ...override };
    return (
      <SelectableElement kind="text" label="Familiennamen" selected={selectedKey === "family"} onSelect={() => setSelectedKey("family")}>
        <div className="customizer-card-families" style={containerStyle}>
          <div>
            <InlineEditableField value={draft.familyLeft} onChange={(text) => updateDraft({ familyLeft: text })} placeholder="—" onFocus={() => setSelectedKey("family")} style={nameStyle} />
            <small>AİLESİ</small>
          </div>
          <div className="customizer-card-families-div" style={{ background: `${draft.accent}66` }} />
          <div>
            <InlineEditableField value={draft.familyRight} onChange={(text) => updateDraft({ familyRight: text })} placeholder="—" onFocus={() => setSelectedKey("family")} style={nameStyle} />
            <small>AİLESİ</small>
          </div>
        </div>
      </SelectableElement>
    );
  }

  function renderDate(style: CSSProperties) {
    return (
      <SelectableElement kind="date" label={TEXT_ELEMENT_LABELS.date} selected={selectedKey === "date"} onSelect={() => setSelectedKey("date")} style={style}>
        <div className="customizer-card-date" style={{ color: style.color }}>
          {draftDateText() || "Datum & Uhrzeit"}
        </div>
      </SelectableElement>
    );
  }

  // Ersetzt die vier fest verdrahteten Bloecke (Countdown/Zusagen/Sitzplan/
  // Galerie) + die separate Chip-Liste fuer die restlichen 10 Module durch
  // eine einzige, nach draft.sectionOrder sortierte Liste — jedes der 14
  // Module bekommt jetzt seinen eigenen Vorschau-Block (Nutzer-Entscheidung,
  // siehe Plan), und die Reihenfolge wird ueber SectionsList im Panel
  // steuerbar statt fest im JSX zu stehen.
  function renderSection(key: string): ReactNode {
    switch (key) {
      case "countdown":
        if (!draft.showCountdown) return null;
        return (
          <div className="customizer-card-countdown" key={key}>
            {[
              ["14", "TAGE"],
              ["06", "STD"],
              ["32", "MIN"],
            ].map(([n, l]) => (
              <div key={l} style={{ color: draft.primary }}>
                <div style={{ fontFamily: font.cssVar, color: draft.accent }}>{n}</div>
                <div>{l}</div>
              </div>
            ))}
          </div>
        );
      case "rsvp":
        if (!draft.showRsvp) return null;
        return (
          <div className="customizer-card-rsvp" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <div style={{ color: draft.primary }}>Kommt ihr?</div>
            <div>
              <span style={{ background: draft.accent, color: draft.background }}>Zusagen</span>
              <span style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>Absagen</span>
            </div>
          </div>
        );
      case "seating":
        if (!draft.showSeating) return null;
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <div style={{ color: draft.primary }}>Sitzplan-Suche</div>
            <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
              Euer Name …
            </div>
            <div className="customizer-card-seating-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} style={i === 2 ? { background: draft.accent } : { borderColor: `${draft.accent}55` }} />
              ))}
            </div>
          </div>
        );
      case "gallery":
        if (!draft.showGallery) return null;
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <div style={{ color: draft.primary }}>Foto- &amp; Videogalerie</div>
            <div className="customizer-card-gallery-grid">
              {[0.9, 0.6, 0.8, 0.5, 1, 0.7].map((o, i) => (
                <span key={i} style={{ background: draft.accent, opacity: o * 0.5 }} />
              ))}
            </div>
          </div>
        );
      default: {
        if (!draft.extraFeatures[key]) return null;
        const feature = EXTRA_FEATURES.find((f) => f.key === key);
        if (!feature) return null;
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <div style={{ color: draft.primary }}>{feature.label}</div>
            {renderExtraFeatureContent(key)}
          </div>
        );
      }
    }
  }

  // Rein statische Beispielinhalte je Modul (keine echte Interaktivitaet
  // noetig, siehe Plan) — visuell im selben Stil wie die bestehenden
  // Sitzplan-/Galerie-Bloecke oben.
  function renderExtraFeatureContent(key: string): ReactNode {
    switch (key) {
      case "agenda":
        return (
          <div className="customizer-card-agenda">
            {[
              ["16:00", "Sektempfang"],
              ["17:00", "Zeremonie"],
              ["19:00", "Feier"],
            ].map(([time, label]) => (
              <div key={label}>
                <span className="customizer-card-agenda-dot" style={{ background: draft.accent }} />
                <span className="customizer-card-agenda-time" style={{ color: draft.accent }}>
                  {time}
                </span>
                <span style={{ color: draft.primary }}>{label}</span>
              </div>
            ))}
          </div>
        );
      case "guestbook":
        return (
          <>
            <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
              Eure Nachricht …
            </div>
            <div className="customizer-card-note" style={{ borderColor: `${draft.accent}55`, color: draft.primary }}>
              „Wir freuen uns riesig für euch — alles Liebe!“ – Familie Kaya
            </div>
          </>
        );
      case "dresscode":
        return (
          <div className="customizer-card-info-line" style={{ color: draft.primary }}>
            Elegant / Smart Casual
          </div>
        );
      case "social-media":
        return (
          <div className="customizer-card-info-line" style={{ color: draft.primary }}>
            #EureHochzeit2026
          </div>
        );
      case "menu":
        return (
          <div className="customizer-card-chips">
            {["Vorspeise", "Hauptgang", "Dessert"].map((label) => (
              <span key={label} style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                {label}
              </span>
            ))}
          </div>
        );
      case "wishlist":
        return (
          <div className="customizer-card-chips">
            {["Geschirr-Set", "Reisegutschein", "Küchenmaschine"].map((label) => (
              <span key={label} style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                {label}
              </span>
            ))}
          </div>
        );
      case "music-requests":
        return (
          <>
            <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
              Song oder Interpret …
            </div>
            <div className="customizer-card-chips">
              <span style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>♪ Perfect – Ed Sheeran</span>
            </div>
          </>
        );
      case "thank-you-card":
        return (
          <div className="customizer-card-info-line" style={{ color: draft.primary }}>
            Erscheint automatisch nach dem Fest
          </div>
        );
      case "audio-invitation":
        return (
          <div className="customizer-card-play-mock" style={{ borderColor: `${draft.accent}88` }}>
            <span className="customizer-card-play-btn" style={{ background: draft.accent, color: draft.background }}>
              ▶
            </span>
            <div className="customizer-card-audio-wave" aria-hidden="true">
              {[6, 11, 15, 9, 16, 7, 12].map((h, i) => (
                <span key={i} style={{ height: h, background: `${draft.accent}99` }} />
              ))}
            </div>
          </div>
        );
      case "video-invitation":
        return (
          <div className="customizer-card-play-mock" style={{ borderColor: `${draft.accent}88` }}>
            <span className="customizer-card-play-btn" style={{ background: draft.accent, color: draft.background }}>
              ▶
            </span>
            <span style={{ color: draft.primary, fontSize: 10.5 }}>Videobotschaft ansehen</span>
          </div>
        );
      default:
        return null;
    }
  }

  function handleImageFile(file: File | null) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      alert("Bild ist zu groß (max. 2,5 MB) für die Vorschau ohne Konto.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateDraft({ image: String(reader.result) });
    reader.readAsDataURL(file);
  }

  function applyAndContinue() {
    saveDrafts(drafts);
    // Marker fuer ApplyPendingDraft.tsx (gemountet auf /dashboard) — liest
    // nach dem Login genau diesen Draft aus localStorage und erzeugt daraus
    // ein echtes Event (siehe /dashboard/apply-draft/route.ts). Ohne diesen
    // Marker wuerde der Entwurf nach dem Login nie wieder gelesen.
    try {
      window.localStorage.setItem(PENDING_DRAFT_KEY, item.id);
    } catch {
      // localStorage voll oder deaktiviert — Entwurf bleibt dann leider nur lokal in diesem Formular erhalten.
    }
    setSavedHint(true);
    router.push("/login");
  }

  const font = FONT_OPTIONS.find((f) => f.id === draft.fontId) ?? FONT_OPTIONS[0];
  const zone = item.cardImageUrl ? cardTextZone(item.layoutKey) : null;

  // Vereinheitlicht die vier fest benannten Umschalter
  // (Countdown/Zusagen/Sitzplan/Galerie) und die EXTRA_FEATURES zu einer
  // Liste, damit sie zusammen nach Paket gruppiert werden koennen — der
  // Kunde soll den Preis einmal pro Paket sehen, nicht raten muessen, was
  // "ab VIP" kostet.
  const toggleItems: { key: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }[] = [
    { key: "countdown", label: "Countdown", description: CORE_FEATURE_DESCRIPTIONS.countdown, checked: draft.showCountdown, onChange: (v) => updateDraft({ showCountdown: v }) },
    { key: "rsvp", label: "Zusagen-Bereich", description: CORE_FEATURE_DESCRIPTIONS.rsvp, checked: draft.showRsvp, onChange: (v) => updateDraft({ showRsvp: v }) },
    { key: "seating", label: "Sitzplan-Suche", description: CORE_FEATURE_DESCRIPTIONS.seating, checked: draft.showSeating, onChange: (v) => updateDraft({ showSeating: v }) },
    { key: "gallery", label: "Foto- & Videogalerie", description: CORE_FEATURE_DESCRIPTIONS.gallery, checked: draft.showGallery, onChange: (v) => updateDraft({ showGallery: v }) },
    ...EXTRA_FEATURES.map((f) => ({
      key: f.key,
      label: f.label,
      description: f.description,
      checked: draft.extraFeatures[f.key] ?? true,
      onChange: (v: boolean) => updateDraft({ extraFeatures: { ...draft.extraFeatures, [f.key]: v } }),
    })),
  ];
  const toggleGroups = TIER_ORDER.map((tier) => ({
    tier,
    items: toggleItems.filter((t) => FEATURE_TIER[t.key] === tier),
  })).filter((g) => g.items.length > 0);

  // Eigene Liste getrennt vom nach Paket gruppierten Funktionen-Tab: dort
  // geht es darum, WAS ein Paket freischaltet, hier nur um die Reihenfolge
  // der bereits aktivierten Abschnitte auf der Karte — beides zusammen in
  // einer Liste wuerde die Preis-Gruppierung durcheinanderbringen.
  const sectionItems = draft.sectionOrder
    .map((key) => toggleItems.find((t) => t.key === key))
    .filter((t): t is (typeof toggleItems)[number] => Boolean(t))
    .map((t) => ({ key: t.key, label: t.label, checked: t.checked, tier: FEATURE_TIER[t.key] }));

  function moveSection(key: string, direction: "up" | "down") {
    const order = [...draft.sectionOrder];
    const idx = order.indexOf(key);
    if (idx === -1) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= order.length) return;
    [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
    updateDraft({ sectionOrder: order });
  }

  function toggleSection(key: string, value: boolean) {
    toggleItems.find((t) => t.key === key)?.onChange(value);
  }

  return (
    <div className="studio-page">
      <div className="studio-top">
        <Link href="/" className="logo">
          <svg width="26" height="20" viewBox="0 0 28 22" fill="none" stroke="var(--terracotta)" strokeWidth="1.4">
            <rect x="1" y="1" width="26" height="20" rx="1.5" />
            <path d="M1.5 2l12 9.5 12-9.5" />
          </svg>
          <span>einladi</span>
        </Link>
        <div className="studio-top-cat">
          {categoryDisplay} · {item.name}
        </div>
        <Link href="/#vorlagen" className="studio-back">
          ← Zur Übersicht
        </Link>
      </div>

      <div className="studio-grid">
        <div className="studio-canvas-col">
          <div className="studio-canvas">
            <div
              className="customizer-card"
              style={{
                background: draft.background,
                borderColor: draft.accent,
                ...(item.photoBackground && draft.showPhotoBackground
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(${item.photoBackground.tint},0.55) 0%, rgba(${item.photoBackground.tint},0.78) 55%, rgba(${item.photoBackground.tint},0.94) 100%), url(${item.photoBackground.src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}),
              }}
            >
              <div className="customizer-card-frame" style={{ borderColor: `${draft.accent}66` }}>
                {item.cardImageUrl && zone ? (
                  <div style={{ position: "relative", margin: "-26px -20px 18px", width: "calc(100% + 40px)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- feste Kartengrafik mit variablem Seitenverhaeltnis je Design */}
                    <img src={item.cardImageUrl} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                    <div
                      style={{
                        position: "absolute",
                        inset: `${zone.top}% ${zone.right}% ${zone.bottom}% ${zone.left}%`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        // Verteilt Label / Name / Datum+Ort ueber die gesamte
                        // Sicherheitszone statt sie eng zusammenzudraengen —
                        // nutzt den Freiraum, den jede Karte mitbringt.
                        justifyContent: "space-evenly",
                        textAlign: "center",
                      }}
                    >
                      {renderEventLabel({ color: draft.accent, marginBottom: 0 })}
                      {renderTitle({
                        fontFamily: font.cssVar,
                        fontStyle: font.italic ? "italic" : "normal",
                        textTransform: font.uppercase ? "uppercase" : "none",
                        fontSize: draft.fontSize,
                        color: draft.primary,
                      })}
                      <div>
                        {renderDate({ color: draft.primary, marginTop: 0, marginBottom: 6 })}
                        <div className="customizer-card-location" style={{ color: draft.primary }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill={draft.accent}>
                            <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
                          </svg>
                          {draft.locationText || "Ort / Location eingeben"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {draft.showFloral && !(item.photoBackground && draft.showPhotoBackground) && (
                      <svg
                        className="customizer-card-floral"
                        viewBox="0 0 300 400"
                        preserveAspectRatio="xMidYMid slice"
                        aria-hidden="true"
                      >
                        <defs>
                          <pattern
                            id={`floral-${item.id}`}
                            width="70"
                            height="70"
                            patternUnits="userSpaceOnUse"
                            patternTransform="rotate(8)"
                          >
                            <path
                              d="M8 62 Q18 42 34 46 Q30 24 8 18 M34 46 Q46 38 44 20"
                              fill="none"
                              stroke={draft.accent}
                              strokeWidth="1.1"
                            />
                            <circle cx="34" cy="46" r="1.8" fill={draft.accent} stroke="none" />
                            <circle cx="8" cy="18" r="1.4" fill={draft.accent} stroke="none" />
                          </pattern>
                        </defs>
                        <rect width="300" height="400" fill={`url(#floral-${item.id})`} />
                      </svg>
                    )}
                    {draft.showOrnaments && (
                      <>
                        <CornerMotif color={draft.accent} corner="tl" />
                        <CornerMotif color={draft.accent} corner="tr" />
                        <CornerMotif color={draft.accent} corner="bl" />
                        <CornerMotif color={draft.accent} corner="br" />
                        <div className="customizer-card-dots">
                          {category === "Sünnet" ? <NazarScatter /> : <DotScatter color={draft.accent} />}
                        </div>
                      </>
                    )}

                    {draft.image && (
                      <div className="customizer-card-photo-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element -- user upload (data URL), unknown dimensions */}
                        <img src={draft.image} alt="" style={photoStyle(draft.photoShape)} />
                      </div>
                    )}

                    {renderEventLabel({ color: draft.accent })}
                    {renderTitle({
                      fontFamily: font.cssVar,
                      fontStyle: font.italic ? "italic" : "normal",
                      textTransform: font.uppercase ? "uppercase" : "none",
                      fontSize: draft.fontSize,
                      color: draft.accent,
                    })}

                    {renderFamily({ color: draft.primary })}

                    <div className="customizer-card-divider" style={{ background: draft.accent }} />
                    {renderDate({ color: draft.primary })}
                    <div className="customizer-card-location" style={{ color: draft.primary }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill={draft.accent}>
                        <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                      {draft.locationText || "Ort / Location eingeben"}
                    </div>
                  </>
                )}

                {/* Google Maps/Kalender sind feste UI-Chrome-Elemente, keine
                    umschalt-/sortierbaren Paket-Module — bleiben deshalb
                    ausserhalb der sectionOrder-Liste, direkt unter dem
                    Kopfbereich. */}
                <div className="customizer-card-actions">
                  <span style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>Google Maps</span>
                  <span style={{ background: draft.accent, borderColor: draft.accent, color: draft.background }}>
                    Kalender
                  </span>
                </div>

                {draft.sectionOrder.map((key) => (
                  <Fragment key={key}>{renderSection(key)}</Fragment>
                ))}
              </div>
            </div>

            {(prevId || nextId) && (
              <div className="studio-nav">
                {prevId ? (
                  <Link href={`/gestalten/${prevId}`}>‹ Vorheriges Design</Link>
                ) : (
                  <span />
                )}
                {nextId && <Link href={`/gestalten/${nextId}`}>Nächstes Design ›</Link>}
              </div>
            )}
          </div>
        </div>

        <div className="studio-panel-sticky">
          <div className="studio-panel-scroll">
          <ContextPanel tabs={PANEL_TABS} activeTabId={activeTab} onTabChange={setActiveTab}>
          {activeTab !== "funktionen" && (
        <>
          {selectedKey === "date" ? (
            <section className="studio-section">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h4 style={{ margin: 0 }}>{TEXT_ELEMENT_LABELS.date}</h4>
                <button
                  type="button"
                  onClick={() => setSelectedKey(undefined)}
                  style={{ fontSize: 11, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Abwählen
                </button>
              </div>
              <DateQuickEdit eventDate={draft.eventDate} eventTime={draft.eventTime} onChange={(next) => updateDraft(next)} />
            </section>
          ) : selectedKey ? (
            <section className="studio-section">
              <TextControls
                elementKey={selectedKey}
                label={TEXT_ELEMENT_LABELS[selectedKey]}
                style={draft.elements?.[selectedKey] ?? {}}
                defaultColor={draft.primary}
                onChange={(patch) => updateElementStyle(selectedKey, patch)}
                onDeselect={() => setSelectedKey(undefined)}
              />
            </section>
          ) : null}
          <section className="studio-section">
            <h4>Texte</h4>
            <p className="studio-section-intro">Name/Titel, Anlass-Label, Familiennamen und Datum direkt in der Karte anklicken und bearbeiten.</p>
            <div className="customizer-form">
              <div className="customizer-field">
                <label htmlFor={`location-${item.id}`}>Ort / Location</label>
                <input
                  id={`location-${item.id}`}
                  className="customizer-text-input"
                  type="text"
                  value={draft.locationText}
                  placeholder="z. B. Dedeman Sarayı, Bremen"
                  onChange={(e) => updateDraft({ locationText: e.target.value })}
                />
                <span className="customizer-hint">Google-Maps-Autovervollständigung folgt hier in Kürze.</span>
              </div>

              <div className="customizer-row">
                <div className="customizer-field" style={{ flex: 1, minWidth: 140 }}>
                  <label htmlFor={`fam-left-${item.id}`}>Familie (links)</label>
                  <input
                    id={`fam-left-${item.id}`}
                    className="customizer-text-input"
                    type="text"
                    value={draft.familyLeft}
                    placeholder="z. B. Demir"
                    onChange={(e) => updateDraft({ familyLeft: e.target.value })}
                  />
                </div>
                <div className="customizer-field" style={{ flex: 1, minWidth: 140 }}>
                  <label htmlFor={`fam-right-${item.id}`}>Familie (rechts)</label>
                  <input
                    id={`fam-right-${item.id}`}
                    className="customizer-text-input"
                    type="text"
                    value={draft.familyRight}
                    placeholder="z. B. Yılmaz"
                    onChange={(e) => updateDraft({ familyRight: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="studio-section">
            <h4>Schrift &amp; Farbe</h4>
            <div className="customizer-form">
              <div className="customizer-field">
                <label>Schriftart</label>
                <FontPicker value={draft.fontId} onChange={(fontId) => updateDraft({ fontId: fontId ?? "cormorant" })} />
              </div>

              <div className="customizer-field">
                <label htmlFor={`size-${item.id}`}>Schriftgröße</label>
                <div className="customizer-slider">
                  <input
                    id={`size-${item.id}`}
                    type="range"
                    min={18}
                    max={40}
                    value={draft.fontSize}
                    onChange={(e) => updateDraft({ fontSize: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: 12, color: "var(--ink-soft)", width: 28 }}>{draft.fontSize}</span>
                </div>
              </div>

              <div className="customizer-row">
                <div className="customizer-field customizer-color">
                  <div>
                    <label htmlFor={`primary-${item.id}`}>Textfarbe</label>
                    <input
                      id={`primary-${item.id}`}
                      type="color"
                      value={draft.primary}
                      onChange={(e) => updateDraft({ primary: e.target.value })}
                    />
                  </div>
                </div>
                <div className="customizer-field customizer-color">
                  <div>
                    <label htmlFor={`accent-${item.id}`}>Akzentfarbe</label>
                    <input
                      id={`accent-${item.id}`}
                      type="color"
                      value={draft.accent}
                      onChange={(e) => updateDraft({ accent: e.target.value })}
                    />
                  </div>
                </div>
                <div className="customizer-field customizer-color">
                  <div>
                    <label htmlFor={`bg-${item.id}`}>Hintergrund</label>
                    <input
                      id={`bg-${item.id}`}
                      type="color"
                      value={draft.background}
                      onChange={(e) => updateDraft({ background: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="studio-section">
            <h4>Foto &amp; Verzierungen</h4>
            <div className="customizer-form">
              <div className="customizer-field">
                <label>Eigenes Foto</label>
                <div className="customizer-upload">
                  <label className="customizer-upload-btn">
                    {draft.image ? "Anderes Foto wählen" : "Foto hochladen"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {draft.image && (
                    <button type="button" className="customizer-upload-remove" onClick={() => updateDraft({ image: null })}>
                      Entfernen
                    </button>
                  )}
                </div>
                {draft.image && (
                  <div className="customizer-shapes">
                    {PHOTO_SHAPES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`customizer-shape-btn${s.id === draft.photoShape ? " is-active" : ""}`}
                        onClick={() => updateDraft({ photoShape: s.id })}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="customizer-field">
                <label>Verzierungen</label>
                <div className="customizer-toggles">
                  <label className="customizer-toggle">
                    <input type="checkbox" checked={draft.showFloral} onChange={(e) => updateDraft({ showFloral: e.target.checked })} />
                    <span className="customizer-switch" aria-hidden="true" />
                    <span className="customizer-toggle-text">Floral-Muster</span>
                  </label>
                  <label className="customizer-toggle">
                    <input type="checkbox" checked={draft.showOrnaments} onChange={(e) => updateDraft({ showOrnaments: e.target.checked })} />
                    <span className="customizer-switch" aria-hidden="true" />
                    <span className="customizer-toggle-text">Eck-Ornamente &amp; Streumuster</span>
                  </label>
                  {item.photoBackground && (
                    <label className="customizer-toggle">
                      <input
                        type="checkbox"
                        checked={draft.showPhotoBackground}
                        onChange={(e) => updateDraft({ showPhotoBackground: e.target.checked })}
                      />
                      <span className="customizer-switch" aria-hidden="true" />
                      <span className="customizer-toggle-text">Foto-Hintergrund</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="studio-section">
            <h4>Reihenfolge &amp; Sichtbarkeit</h4>
            <p className="studio-section-intro">
              Bestimmt, welche aktivierten Abschnitte auf der Karte erscheinen und in welcher Reihenfolge.
            </p>
            <SectionsList items={sectionItems} onToggle={toggleSection} onMove={moveSection} />
          </section>
        </>
          )}
          {activeTab === "funktionen" && (
        <>
          <section className="studio-section">
            <h4>Funktionen</h4>
            <p className="studio-section-intro">
              Wählt aus, was eure Gäste auf der Einladungsseite nutzen können — Details &amp; Preise pro Paket unter
              „Details →“.
            </p>
            <div className="customizer-tier-groups">
              {toggleGroups.map((group) => (
                <div className="customizer-tier-group" key={group.tier}>
                  <div className="customizer-tier-head">
                    <span>{group.tier}</span>
                    <Link href={`/preise/${packageSlug(PACKAGE_KEY_BY_TIER[group.tier])}`} className="customizer-tier-price" target="_blank" rel="noopener noreferrer">
                      ab {eur.format(TIER_PRICE[group.tier] / 100)} · Details →
                    </Link>
                  </div>
                  <div className="customizer-toggles">
                    {group.items.map((t) => (
                      <label className="customizer-toggle customizer-toggle-compact" key={t.key}>
                        <input type="checkbox" checked={t.checked} onChange={(e) => t.onChange(e.target.checked)} />
                        <span className="customizer-switch" aria-hidden="true" />
                        <span className="customizer-toggle-text">{t.label}</span>
                        <span className="customizer-tier-badge">ab {group.tier}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <span className="customizer-hint">Alle Funktionen sind hier zur Ansicht aktiv, damit ihr seht, wie die Seite damit aussieht.</span>
          </section>
        </>
          )}
          </ContextPanel>
          </div>

          <div className="studio-panel-cta">
            <button type="button" className="btn btn-primary" onClick={applyAndContinue}>
              Design speichern &amp; Konto erstellen
            </button>
            {savedHint && <span className="customizer-saved">Gespeichert — geht gleich weiter.</span>}
          </div>
        </div>
      </div>

      {otherInCategory.length > 0 && (
        <section className="studio-section studio-alt">
          <h4>Andere Designs in {categoryDisplay}</h4>
          <div className="studio-alt-grid">
            {otherInCategory.map((o) => (
              <Link key={o.id} href={`/gestalten/${o.id}`} className="studio-alt-tile">
                <TemplatePreview layoutKey={o.layoutKey} />
                <span>{o.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
