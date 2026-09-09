"use client";

import { Fragment, useEffect, useState } from "react";
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
import { PlaceAutocompleteField } from "@/components/editor/PlaceAutocompleteField";
import { GOOGLE_MAPS_API_KEY, googleMapsSearchUrl } from "@/lib/google-maps";
import { InlineEditableField } from "@/components/public/InlineEditableField";
import { FileField } from "@/components/public/FileField";
import { SectionsList } from "@/components/dashboard/panels/SectionsList";
import { AgendaList } from "@/components/editor/AgendaList";
import { AgendaItemQuickEdit } from "@/components/editor/AgendaItemQuickEdit";
import { defaultAgendaItems, newAgendaItem, moveAgendaItem, type AgendaItem } from "@/lib/agenda";
import { WishlistList } from "@/components/editor/WishlistList";
import { WishlistItemQuickEdit } from "@/components/editor/WishlistItemQuickEdit";
import { defaultWishlistItems, newWishlistItem, moveWishlistItem, type WishlistItemData } from "@/lib/wishlist";
import {
  elementOverrideStyle,
  TEXT_ELEMENT_LABELS,
  DEFAULT_DRESSCODE_TEXT,
  DEFAULT_SOCIAL_MEDIA_TEXT,
  type StyleElements,
  type TextElementKey,
  type TextElementStyle,
} from "@/lib/text-style";

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
  // Gesetzt, sobald die Adresse per Google-Places-Autocomplete ausgewaehlt
  // wurde (siehe renderLocation/PlaceAutocompleteField) — null solange nur
  // Freitext eingegeben wurde, ohne einen Vorschlag auszuwaehlen.
  locationLat: number | null;
  locationLng: number | null;
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
  // Editor-Konsistenz-Auftrag, Teil A — Uploads ueber upload-media/route.ts,
  // gespeicherte URL (nicht die Datei selbst, siehe uploadDraftMedia() unten
  // und Kommentar bei anonymousDraftId). null = noch keine Datei.
  anonymousDraftId: string | null;
  envelopeVideoUrl: string | null;
  backgroundMusicUrl: string | null;
  audioInvitationUrl: string | null;
  videoMessageUrl: string | null;
  extraFeatures: Record<string, boolean>;
  // Echtes Datenmodell statt statischer Beispielinhalte (siehe
  // Umsetzungsplan "Ablaufplan"-Schritt) — Liste bleibt leer relevant fuer
  // die Karte, solange extraFeatures.agenda nicht aktiv ist.
  agendaItems: AgendaItem[];
  // Feste Einzeltexte (kein Array wie beim Ablaufplan) fuer den
  // Gaestebuch-Vorschaublock, siehe Schritt 3 — analog zu Event.guestbook*
  // auf der echten Event-Seite.
  guestbookHeading: string;
  guestbookHint: string;
  guestbookButtonText: string;
  // Wunschliste (Schritt 4): echtes Datenmodell wie Ablaufplan (die reale
  // WishlistItem-Tabelle hat bereits Typ/Titel/Beschreibung/Link, siehe
  // lib/wishlist.ts) — kein Button-Text, dafuer gibt es keine Gaeste-Aktion.
  wishlistHeading: string;
  wishlistHint: string;
  wishlistItems: WishlistItemData[];
  // Musikwuensche (Schritt 4): fester Einzeltext wie Gaestebuch (echtes
  // Gaeste-Formular, kein vom Paar gepflegtes Artikel-Datenmodell).
  musicHeading: string;
  musicHint: string;
  musicButtonText: string;
  // Countdown-Beschriftungen (Schritt 5) — die Zahlen bleiben dynamisch
  // (14/06/32 als reine Vorschau-Beispielwerte), nur die drei
  // Einheiten-Woerter sind editierbar, siehe Countdown.tsx fuer die echte
  // Event-Seite (gleiches Prinzip, dort per Timer berechnet).
  countdownDaysLabel: string;
  countdownHoursLabel: string;
  countdownMinutesLabel: string;
  // Kalender-Buttons unter dem Countdown (nicht der "Google Maps"-Chip der
  // Location-Sektion, siehe customizer-card-actions weiter unten).
  calendarSaveText: string;
  calendarGoogleText: string;
  // RSVP-Bereich — Ueberschrift + drei Options-Beschriftungen + Button.
  // Das echte Formular hat statt zwei Pillen drei Radio-Optionen plus
  // Absende-Button (siehe e/[slug]/page.tsx), deshalb fuenf statt zwei
  // editierbare Texte, fuer Deckungsgleichheit mit dem echten Editor.
  rsvpHeading: string;
  rsvpYesLabel: string;
  rsvpMaybeLabel: string;
  rsvpNoLabel: string;
  rsvpButtonText: string;
  // Sitzplan-Suche — Ueberschrift + Hinweistext + Such-Button (Schritt 6).
  // Das echte Sitzplan-Datenmodell bleibt unangetastet, siehe e/[slug]/page.tsx.
  seatingHeading: string;
  seatingHint: string;
  seatingButtonText: string;
  // Foto-/Videogalerie — Ueberschrift + Hinweistext + Upload-Button (Schritt 6).
  galleryHeading: string;
  galleryHint: string;
  galleryButtonText: string;
  // Dresscode/Social Media (Schritt 7) — komplett neu, kein Datenmodell.
  dresscodeHeading: string;
  dresscodeText: string;
  socialMediaHeading: string;
  socialMediaText: string;
  // Digitale Menuekarte — nur Ueberschrift + Hinweistext, das echte
  // MenuItem-Datenmodell bleibt unangetastet (siehe Nutzer-Rueckfrage).
  menuHeading: string;
  menuHint: string;
  // Digitale Dankeskarte — nur die Ueberschrift ist neu, der Dankestext
  // selbst liegt serverseitig im EventModule.config (siehe Kommentar in
  // schema.prisma), im anonymen Customizer aber ganz normal als String-Feld
  // im Draft, genau wie alle anderen Texte hier.
  thankYouHeading: string;
  thankYouMessage: string;
  // Audio-/Video-Einladung — komplett neue Features (Schritt 7).
  audioInvitationHeading: string;
  audioInvitationHint: string;
  videoMessageHeading: string;
  videoMessageHint: string;
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

// Editor-Konsistenz-Auftrag, Teil A: dieselben vier Tabs wie im
// eingeloggten Dashboard-Editor (DesignEditor.tsx PANEL_TABS) — vorher nur
// dort verfuegbar, siehe upload-media/route.ts fuer den anonymen Upload-Weg.
const PANEL_TABS = [
  { id: "design", label: "Design" },
  { id: "funktionen", label: "Funktionen" },
  { id: "envelope", label: "Umschlag" },
  { id: "music", label: "Musik" },
  { id: "audio-invitation", label: "Audio-Einladung" },
  { id: "video-message", label: "Video-Einladung" },
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
    locationLat: null,
    locationLng: null,
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
    anonymousDraftId: null,
    envelopeVideoUrl: null,
    backgroundMusicUrl: null,
    audioInvitationUrl: null,
    videoMessageUrl: null,
    extraFeatures: Object.fromEntries(EXTRA_FEATURES.map((f) => [f.key, true])),
    sectionOrder: DEFAULT_SECTION_ORDER,
    agendaItems: defaultAgendaItems(),
    guestbookHeading: "Gästebuch",
    guestbookHint: "Hinterlasst uns eure schönsten Wünsche und Erinnerungen.",
    guestbookButtonText: "Nachricht hinterlassen",
    wishlistHeading: "Wunschliste",
    wishlistHint: "Über jeden Herzenswunsch freuen wir uns.",
    wishlistItems: defaultWishlistItems(),
    musicHeading: "Musikwünsche",
    musicHint: "Welcher Song darf auf der Tanzfläche nicht fehlen?",
    musicButtonText: "Musikwunsch einreichen",
    countdownDaysLabel: "TAGE",
    countdownHoursLabel: "STD",
    countdownMinutesLabel: "MIN",
    calendarSaveText: "In Kalender speichern",
    calendarGoogleText: "Google Kalender",
    rsvpHeading: "Kommt ihr?",
    rsvpYesLabel: "Zusagen",
    rsvpMaybeLabel: "Unsicher",
    rsvpNoLabel: "Absagen",
    rsvpButtonText: "Zusage senden",
    seatingHeading: "Finde deinen Sitzplatz",
    seatingHint: "Gib deinen Namen ein.",
    seatingButtonText: "Suchen",
    galleryHeading: "Teilt eure schönsten Momente",
    galleryHint: "",
    galleryButtonText: "Foto oder Video auswählen",
    dresscodeHeading: "Dresscode",
    dresscodeText: DEFAULT_DRESSCODE_TEXT,
    socialMediaHeading: "Social Media",
    socialMediaText: DEFAULT_SOCIAL_MEDIA_TEXT,
    menuHeading: "Menü",
    menuHint: "",
    thankYouHeading: "Danke euch von Herzen",
    thankYouMessage: "",
    audioInvitationHeading: "Eine Nachricht für euch",
    audioInvitationHint: "",
    videoMessageHeading: "Unsere Videobotschaft",
    videoMessageHint: "",
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
  // Bewusst NICHT als Lazy-Initializer (frueher: useState(loadDrafts)) —
  // das lieferte serverseitig immer {} (kein window), aber clientseitig
  // beim ersten Render bereits den echten localStorage-Inhalt, was bei
  // jedem Aufruf mit gespeichertem Entwurf einen echten Hydration-Fehler
  // ausloeste (Server- und Client-Baum wichen sofort voneinander ab,
  // React verwarf den SSR-Baum und rendert neu — reproduzierbar in der
  // Konsole als "Hydration failed"). Stattdessen startet der Client
  // identisch zum Server mit {} und laedt den Entwurf erst NACH der
  // Hydration per Effect nach — das ist ein normales, hydration-sicheres
  // Nachladen statt eines SSR/CSR-Wertunterschieds.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  useEffect(() => {
    // Bewusstes einmaliges Nachladen nach der Hydration (siehe Kommentar
    // oben) statt eines Lazy-Initializers — die einzige Alternative ohne
    // setState-im-Effect waere useSyncExternalStore, was hier unverhaeltnis-
    // maessig waere, da drafts danach auch lokal (nicht nur extern) über
    // updateDraft() mutiert wird.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts(loadDrafts());
  }, []);
  const [savedHint, setSavedHint] = useState(false);
  // Editor-Konsistenz-Auftrag, Teil A — Ladezustand/Fehler fuer Umschlag-
  // Video/Musik/Audio-/Video-Einladung-Uploads, siehe uploadDraftMedia()
  // weiter unten.
  const [uploadingKind, setUploadingKind] = useState<"envelope-video" | "background-music" | "audio-invitation" | "video-message" | null>(null);
  const [uploadError, setUploadError] = useState<{ kind: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState("design");
  const [selectedKey, setSelectedKey] = useState<TextElementKey | undefined>(undefined);
  // Eigener Auswahl-State fuer den Ablaufplan statt selectedKey: eine
  // variable Liste hat keinen festen TextElementKey, jeder Eintrag braucht
  // seine eigene id. Beide Auswahlen schliessen sich gegenseitig aus (siehe
  // selectKey()/selectAgendaItem() unten), damit das Panel nie zwei
  // widerspruechliche Editier-Ansichten gleichzeitig anzeigen will.
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | undefined>(undefined);
  function selectKey(key: TextElementKey) {
    setSelectedKey(key);
    setSelectedAgendaId(undefined);
    setSelectedWishlistId(undefined);
  }
  function selectAgendaItem(id: string) {
    setSelectedAgendaId(id);
    setSelectedKey(undefined);
    setSelectedWishlistId(undefined);
  }
  // Analog zum Ablaufplan (Schritt 4): eigener Auswahl-State fuer die
  // Wunschliste, alle drei Auswahlen schliessen sich gegenseitig aus.
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | undefined>(undefined);
  function selectWishlistItem(id: string) {
    setSelectedWishlistId(id);
    setSelectedKey(undefined);
    setSelectedAgendaId(undefined);
  }
  // Auf schmalen Bildschirmen (siehe .studio-panel-sticky-Mobile-Regel in
  // globals.css) wird das Panel bei einer Auswahl zu einem fixierten
  // Bottom-Sheet — vorher stand es einfach im normalen Textfluss unter der
  // ganzen (oft sehr langen) Karte und war dadurch praktisch unerreichbar
  // ohne langes Scrollen, obwohl es technisch da war (Bugfix). hasSelection
  // fasst alle drei sich gegenseitig ausschliessenden Auswahl-States
  // zusammen, deselectAll() ist der "X schliessen"-Handler des Sheets.
  const hasSelection = Boolean(selectedKey || selectedAgendaId || selectedWishlistId);
  function deselectAll() {
    setSelectedKey(undefined);
    setSelectedAgendaId(undefined);
    setSelectedWishlistId(undefined);
  }

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

  function updateAgendaItem(id: string, patch: Partial<AgendaItem>) {
    updateDraft({ agendaItems: draft.agendaItems.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }
  function updateAgendaItemStyle(id: string, patch: Partial<TextElementStyle>) {
    updateAgendaItem(id, { style: { ...draft.agendaItems.find((it) => it.id === id)?.style, ...patch } });
  }
  function addAgendaItem() {
    const item = newAgendaItem();
    updateDraft({ agendaItems: [...draft.agendaItems, item] });
    selectAgendaItem(item.id);
  }
  function removeAgendaItem(id: string) {
    updateDraft({ agendaItems: draft.agendaItems.filter((it) => it.id !== id) });
    if (selectedAgendaId === id) setSelectedAgendaId(undefined);
  }
  function moveAgendaItemHandler(id: string, direction: "up" | "down") {
    updateDraft({ agendaItems: moveAgendaItem(draft.agendaItems, id, direction) });
  }

  // Wunschliste (Schritt 4): kein updateWishlistItemStyle noetig, ein
  // Wunschartikel hat keinen eigenen Stil (siehe lib/wishlist.ts).
  function updateWishlistItem(id: string, patch: Partial<WishlistItemData>) {
    updateDraft({ wishlistItems: draft.wishlistItems.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  }
  function addWishlistItem() {
    const item = newWishlistItem();
    updateDraft({ wishlistItems: [...draft.wishlistItems, item] });
    selectWishlistItem(item.id);
  }
  function removeWishlistItem(id: string) {
    updateDraft({ wishlistItems: draft.wishlistItems.filter((it) => it.id !== id) });
    if (selectedWishlistId === id) setSelectedWishlistId(undefined);
  }
  function moveWishlistItemHandler(id: string, direction: "up" | "down") {
    updateDraft({ wishlistItems: moveWishlistItem(draft.wishlistItems, id, direction) });
  }

  // Kleine Render-Helfer statt doppelt kopierter Klick-Auswahl-Logik in den
  // beiden Karten-Layouts (mit/ohne Kartengrafik) — gleiches Muster wie
  // renderEventLabel/renderTitle/renderFamily in HeroCard.tsx.
  function renderEventLabel(style: CSSProperties) {
    const override = elementOverrideStyle(draft.elements, "eventLabel");
    return (
      <SelectableElement kind="text" label="Anlass-Label" selected={selectedKey === "eventLabel"} onSelect={() => selectKey("eventLabel")}>
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
      <SelectableElement kind="text" label="Name / Titel" selected={selectedKey === "title"} onSelect={() => selectKey("title")}>
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
    // Bewusst KEIN "beide leer -> null"-Guard (mehr): die Karte ist seit
    // Punkt 6 der Review die einzige Stelle, an der Familiennamen ueberhaupt
    // eingegeben werden koennen (das alte <input>-Paar im Texte-Panel ist
    // entfernt) — ein komplett unangetasteter Entwurf muss also weiterhin
    // eine klickbare Platzhalter-Flaeche zeigen, sonst gaebe es fuer einen
    // frischen Entwurf gar keinen Weg mehr, Familiennamen zu setzen. Gleiches
    // Muster wie renderDate()/"Ort / Location eingeben" oben auf der Karte.
    const override = elementOverrideStyle(draft.elements, "family");
    const nameStyle: CSSProperties = { ...override };
    return (
      <SelectableElement kind="text" label="Familiennamen" selected={selectedKey === "family"} onSelect={() => selectKey("family")}>
        <div className="customizer-card-families" style={containerStyle}>
          <div>
            <InlineEditableField value={draft.familyLeft} onChange={(text) => updateDraft({ familyLeft: text })} placeholder="z. B. Demir" onFocus={() => setSelectedKey("family")} style={nameStyle} />
            <small>AİLESİ</small>
          </div>
          <div className="customizer-card-families-div" style={{ background: `${draft.accent}66` }} />
          <div>
            <InlineEditableField value={draft.familyRight} onChange={(text) => updateDraft({ familyRight: text })} placeholder="z. B. Yılmaz" onFocus={() => setSelectedKey("family")} style={nameStyle} />
            <small>AİLESİ</small>
          </div>
        </div>
      </SelectableElement>
    );
  }

  function renderDate(style: CSSProperties) {
    return (
      <SelectableElement kind="date" label={TEXT_ELEMENT_LABELS.date} selected={selectedKey === "date"} onSelect={() => selectKey("date")} style={style}>
        <div className="customizer-card-date" style={{ color: style.color }}>
          {draftDateText() || "Datum & Uhrzeit"}
        </div>
      </SelectableElement>
    );
  }

  // Wie renderDate: Adresse braucht Places-Autocomplete statt Freitext-
  // Tippen, deshalb "kind=date" (Klick waehlt nur aus) statt kind="text" —
  // die eigentliche Eingabe passiert im Panel (siehe unten, selectedKey
  // === "location"), nicht per contentEditable direkt auf der Karte.
  function renderLocation(style: CSSProperties) {
    const override = elementOverrideStyle(draft.elements, "location");
    return (
      <SelectableElement kind="date" label={TEXT_ELEMENT_LABELS.location} selected={selectedKey === "location"} onSelect={() => selectKey("location")} style={style}>
        <div className="customizer-card-location" style={{ color: style.color, ...override }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={draft.accent}>
            <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
          </svg>
          {draft.locationText || "Ort / Location eingeben"}
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
      case "countdown": {
        if (!draft.showCountdown) return null;
        const countdownLabelOverride = elementOverrideStyle(draft.elements, "countdownLabel");
        const countdownUnits: { n: string; field: "countdownDaysLabel" | "countdownHoursLabel" | "countdownMinutesLabel"; value: string }[] = [
          { n: "14", field: "countdownDaysLabel", value: draft.countdownDaysLabel },
          { n: "06", field: "countdownHoursLabel", value: draft.countdownHoursLabel },
          { n: "32", field: "countdownMinutesLabel", value: draft.countdownMinutesLabel },
        ];
        return (
          <div className="customizer-card-countdown" key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.countdownLabel}
              selected={selectedKey === "countdownLabel"}
              onSelect={() => selectKey("countdownLabel")}
            >
              <div style={{ display: "flex", gap: 16 }}>
                {countdownUnits.map(({ n, field, value }) => (
                  <div key={field} style={{ color: draft.primary, textAlign: "center" }}>
                    <div style={{ fontFamily: font.cssVar, color: draft.accent, fontSize: 19 }}>{n}</div>
                    <InlineEditableField
                      value={value}
                      onChange={(text) => updateDraft({ [field]: text } as Partial<Draft>)}
                      onFocus={() => setSelectedKey("countdownLabel")}
                      style={{ fontSize: 8, letterSpacing: "0.1em", opacity: 0.75, ...countdownLabelOverride }}
                    />
                  </div>
                ))}
              </div>
            </SelectableElement>
          </div>
        );
      }
      case "rsvp": {
        if (!draft.showRsvp) return null;
        const rsvpHeadingOverride = elementOverrideStyle(draft.elements, "rsvpHeading");
        const rsvpYesOverride = elementOverrideStyle(draft.elements, "rsvpYesLabel");
        const rsvpMaybeOverride = elementOverrideStyle(draft.elements, "rsvpMaybeLabel");
        const rsvpNoOverride = elementOverrideStyle(draft.elements, "rsvpNoLabel");
        const rsvpButtonOverride = elementOverrideStyle(draft.elements, "rsvpButtonText");
        return (
          <div className="customizer-card-rsvp" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.rsvpHeading}
              selected={selectedKey === "rsvpHeading"}
              onSelect={() => selectKey("rsvpHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.rsvpHeading}
                onChange={(text) => updateDraft({ rsvpHeading: text })}
                placeholder="Kommt ihr?"
                onFocus={() => setSelectedKey("rsvpHeading")}
                style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: draft.primary, ...rsvpHeadingOverride }}
              />
            </SelectableElement>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <SelectableElement
                kind="text"
                label={TEXT_ELEMENT_LABELS.rsvpYesLabel}
                selected={selectedKey === "rsvpYesLabel"}
                onSelect={() => selectKey("rsvpYesLabel")}
              >
                <InlineEditableField
                  value={draft.rsvpYesLabel}
                  onChange={(text) => updateDraft({ rsvpYesLabel: text })}
                  placeholder="Zusagen"
                  onFocus={() => setSelectedKey("rsvpYesLabel")}
                  style={{
                    display: "inline-block",
                    fontSize: 9.5,
                    fontWeight: 600,
                    padding: "6px 14px",
                    border: "1px solid",
                    background: draft.accent,
                    color: draft.background,
                    ...rsvpYesOverride,
                  }}
                />
              </SelectableElement>
              <SelectableElement
                kind="text"
                label={TEXT_ELEMENT_LABELS.rsvpMaybeLabel}
                selected={selectedKey === "rsvpMaybeLabel"}
                onSelect={() => selectKey("rsvpMaybeLabel")}
              >
                <InlineEditableField
                  value={draft.rsvpMaybeLabel}
                  onChange={(text) => updateDraft({ rsvpMaybeLabel: text })}
                  placeholder="Unsicher"
                  onFocus={() => setSelectedKey("rsvpMaybeLabel")}
                  style={{
                    display: "inline-block",
                    fontSize: 9.5,
                    fontWeight: 600,
                    padding: "6px 14px",
                    border: "1px solid",
                    borderColor: `${draft.accent}88`,
                    color: draft.primary,
                    ...rsvpMaybeOverride,
                  }}
                />
              </SelectableElement>
              <SelectableElement
                kind="text"
                label={TEXT_ELEMENT_LABELS.rsvpNoLabel}
                selected={selectedKey === "rsvpNoLabel"}
                onSelect={() => selectKey("rsvpNoLabel")}
              >
                <InlineEditableField
                  value={draft.rsvpNoLabel}
                  onChange={(text) => updateDraft({ rsvpNoLabel: text })}
                  placeholder="Absagen"
                  onFocus={() => setSelectedKey("rsvpNoLabel")}
                  style={{
                    display: "inline-block",
                    fontSize: 9.5,
                    fontWeight: 600,
                    padding: "6px 14px",
                    border: "1px solid",
                    borderColor: `${draft.accent}88`,
                    color: draft.primary,
                    ...rsvpNoOverride,
                  }}
                />
              </SelectableElement>
            </div>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.rsvpButtonText}
              selected={selectedKey === "rsvpButtonText"}
              onSelect={() => selectKey("rsvpButtonText")}
              style={{ display: "block", marginTop: 10 }}
            >
              <InlineEditableField
                value={draft.rsvpButtonText}
                onChange={(text) => updateDraft({ rsvpButtonText: text })}
                placeholder="Zusage senden"
                onFocus={() => setSelectedKey("rsvpButtonText")}
                style={{
                  display: "block",
                  padding: "8px 14px",
                  fontSize: 10.5,
                  fontWeight: 600,
                  background: draft.accent,
                  color: draft.background,
                  textAlign: "center",
                  ...rsvpButtonOverride,
                }}
              />
            </SelectableElement>
          </div>
        );
      }
      case "seating": {
        if (!draft.showSeating) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "seatingHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "seatingHint");
        const buttonOverride = elementOverrideStyle(draft.elements, "seatingButtonText");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.seatingHeading}
              selected={selectedKey === "seatingHeading"}
              onSelect={() => selectKey("seatingHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.seatingHeading}
                onChange={(text) => updateDraft({ seatingHeading: text })}
                placeholder="Finde deinen Sitzplatz"
                onFocus={() => setSelectedKey("seatingHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.seatingHint}
              selected={selectedKey === "seatingHint"}
              onSelect={() => selectKey("seatingHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.seatingHint}
                onChange={(text) => updateDraft({ seatingHint: text })}
                placeholder="Gib deinen Namen ein."
                onFocus={() => setSelectedKey("seatingHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
              Euer Name …
            </div>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.seatingButtonText}
              selected={selectedKey === "seatingButtonText"}
              onSelect={() => selectKey("seatingButtonText")}
              style={{ display: "block", marginTop: 8 }}
            >
              <InlineEditableField
                value={draft.seatingButtonText}
                onChange={(text) => updateDraft({ seatingButtonText: text })}
                placeholder="Suchen"
                onFocus={() => setSelectedKey("seatingButtonText")}
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  fontSize: 10.5,
                  fontWeight: 600,
                  background: draft.accent,
                  color: draft.background,
                  ...buttonOverride,
                }}
              />
            </SelectableElement>
            <div className="customizer-card-seating-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} style={i === 2 ? { background: draft.accent } : { borderColor: `${draft.accent}55` }} />
              ))}
            </div>
          </div>
        );
      }
      case "gallery": {
        if (!draft.showGallery) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "galleryHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "galleryHint");
        const buttonOverride = elementOverrideStyle(draft.elements, "galleryButtonText");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.galleryHeading}
              selected={selectedKey === "galleryHeading"}
              onSelect={() => selectKey("galleryHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.galleryHeading}
                onChange={(text) => updateDraft({ galleryHeading: text })}
                placeholder="Teilt eure schönsten Momente"
                onFocus={() => setSelectedKey("galleryHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.galleryHint}
              selected={selectedKey === "galleryHint"}
              onSelect={() => selectKey("galleryHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.galleryHint}
                onChange={(text) => updateDraft({ galleryHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("galleryHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-gallery-grid">
              {[0.9, 0.6, 0.8, 0.5, 1, 0.7].map((o, i) => (
                <span key={i} style={{ background: draft.accent, opacity: o * 0.5 }} />
              ))}
            </div>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.galleryButtonText}
              selected={selectedKey === "galleryButtonText"}
              onSelect={() => selectKey("galleryButtonText")}
              style={{ display: "block", marginTop: 8 }}
            >
              <InlineEditableField
                value={draft.galleryButtonText}
                onChange={(text) => updateDraft({ galleryButtonText: text })}
                placeholder="Foto oder Video auswählen"
                onFocus={() => setSelectedKey("galleryButtonText")}
                style={{
                  display: "block",
                  padding: "6px 14px",
                  fontSize: 10.5,
                  border: `1px solid ${draft.accent}55`,
                  color: draft.primary,
                  textAlign: "left",
                  ...buttonOverride,
                }}
              />
            </SelectableElement>
          </div>
        );
      }
      case "guestbook": {
        if (!draft.extraFeatures.guestbook) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "guestbookHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "guestbookHint");
        const buttonOverride = elementOverrideStyle(draft.elements, "guestbookButtonText");
        const sampleOverride = elementOverrideStyle(draft.elements, "guestbookSample");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.guestbookHeading}
              selected={selectedKey === "guestbookHeading"}
              onSelect={() => selectKey("guestbookHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.guestbookHeading}
                onChange={(text) => updateDraft({ guestbookHeading: text })}
                placeholder="Gästebuch"
                onFocus={() => setSelectedKey("guestbookHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.guestbookHint}
              selected={selectedKey === "guestbookHint"}
              onSelect={() => selectKey("guestbookHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.guestbookHint}
                onChange={(text) => updateDraft({ guestbookHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("guestbookHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
              Eure Nachricht …
            </div>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.guestbookButtonText}
              selected={selectedKey === "guestbookButtonText"}
              onSelect={() => selectKey("guestbookButtonText")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.guestbookButtonText}
                onChange={(text) => updateDraft({ guestbookButtonText: text })}
                placeholder="Nachricht hinterlassen"
                onFocus={() => setSelectedKey("guestbookButtonText")}
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "6px 14px",
                  fontSize: 10.5,
                  fontWeight: 600,
                  background: draft.accent,
                  color: draft.background,
                  ...buttonOverride,
                }}
              />
            </SelectableElement>
            <SelectableElement
              kind="date"
              label={TEXT_ELEMENT_LABELS.guestbookSample}
              selected={selectedKey === "guestbookSample"}
              onSelect={() => selectKey("guestbookSample")}
              style={{ display: "block", marginTop: 8 }}
            >
              <div className="customizer-card-note" style={{ borderColor: `${draft.accent}55`, color: draft.primary, ...sampleOverride }}>
                „Wir freuen uns riesig für euch — alles Liebe!“ – Familie Kaya
              </div>
            </SelectableElement>
          </div>
        );
      }
      case "wishlist": {
        if (!draft.extraFeatures.wishlist) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "wishlistHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "wishlistHint");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.wishlistHeading}
              selected={selectedKey === "wishlistHeading"}
              onSelect={() => selectKey("wishlistHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.wishlistHeading}
                onChange={(text) => updateDraft({ wishlistHeading: text })}
                placeholder="Wunschliste"
                onFocus={() => setSelectedKey("wishlistHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.wishlistHint}
              selected={selectedKey === "wishlistHint"}
              onSelect={() => selectKey("wishlistHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.wishlistHint}
                onChange={(text) => updateDraft({ wishlistHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("wishlistHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <WishlistList
              items={draft.wishlistItems}
              selectedId={selectedWishlistId}
              onSelect={selectWishlistItem}
              onAdd={addWishlistItem}
              onRemove={removeWishlistItem}
              onMove={moveWishlistItemHandler}
              baseStyle={{ color: draft.primary }}
              accentColor={draft.accent}
            />
          </div>
        );
      }
      case "music-requests": {
        if (!draft.extraFeatures["music-requests"]) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "musicHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "musicHint");
        const buttonOverride = elementOverrideStyle(draft.elements, "musicButtonText");
        const sampleOverride = elementOverrideStyle(draft.elements, "musicSample");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.musicHeading}
              selected={selectedKey === "musicHeading"}
              onSelect={() => selectKey("musicHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.musicHeading}
                onChange={(text) => updateDraft({ musicHeading: text })}
                placeholder="Musikwünsche"
                onFocus={() => setSelectedKey("musicHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.musicHint}
              selected={selectedKey === "musicHint"}
              onSelect={() => selectKey("musicHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.musicHint}
                onChange={(text) => updateDraft({ musicHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("musicHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
              Song oder Interpret …
            </div>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.musicButtonText}
              selected={selectedKey === "musicButtonText"}
              onSelect={() => selectKey("musicButtonText")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.musicButtonText}
                onChange={(text) => updateDraft({ musicButtonText: text })}
                placeholder="Musikwunsch einreichen"
                onFocus={() => setSelectedKey("musicButtonText")}
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "6px 14px",
                  fontSize: 10.5,
                  fontWeight: 600,
                  background: draft.accent,
                  color: draft.background,
                  ...buttonOverride,
                }}
              />
            </SelectableElement>
            <SelectableElement
              kind="date"
              label={TEXT_ELEMENT_LABELS.musicSample}
              selected={selectedKey === "musicSample"}
              onSelect={() => selectKey("musicSample")}
              style={{ display: "block", marginTop: 8 }}
            >
              <div className="customizer-card-chips" style={{ justifyContent: "flex-start" }}>
                <span style={{ borderColor: `${draft.accent}88`, color: draft.primary, ...sampleOverride }}>♪ Perfect – Ed Sheeran</span>
              </div>
            </SelectableElement>
          </div>
        );
      }
      case "dresscode": {
        if (!draft.extraFeatures.dresscode) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "dresscodeHeading");
        const textOverride = elementOverrideStyle(draft.elements, "dresscodeText");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.dresscodeHeading}
              selected={selectedKey === "dresscodeHeading"}
              onSelect={() => selectKey("dresscodeHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.dresscodeHeading}
                onChange={(text) => updateDraft({ dresscodeHeading: text })}
                placeholder="Dresscode"
                onFocus={() => setSelectedKey("dresscodeHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.dresscodeText}
              selected={selectedKey === "dresscodeText"}
              onSelect={() => selectKey("dresscodeText")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.dresscodeText}
                onChange={(text) => updateDraft({ dresscodeText: text })}
                placeholder="z. B. Elegant / Smart Casual"
                onFocus={() => setSelectedKey("dresscodeText")}
                style={{ fontSize: 11, color: draft.primary, opacity: 0.85, ...textOverride }}
              />
            </SelectableElement>
          </div>
        );
      }
      case "social-media": {
        if (!draft.extraFeatures["social-media"]) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "socialMediaHeading");
        const textOverride = elementOverrideStyle(draft.elements, "socialMediaText");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.socialMediaHeading}
              selected={selectedKey === "socialMediaHeading"}
              onSelect={() => selectKey("socialMediaHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.socialMediaHeading}
                onChange={(text) => updateDraft({ socialMediaHeading: text })}
                placeholder="Social Media"
                onFocus={() => setSelectedKey("socialMediaHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.socialMediaText}
              selected={selectedKey === "socialMediaText"}
              onSelect={() => selectKey("socialMediaText")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.socialMediaText}
                onChange={(text) => updateDraft({ socialMediaText: text })}
                placeholder="z. B. #EureHochzeit2026"
                onFocus={() => setSelectedKey("socialMediaText")}
                style={{ fontSize: 11, color: draft.primary, opacity: 0.85, ...textOverride }}
              />
            </SelectableElement>
          </div>
        );
      }
      case "menu": {
        if (!draft.extraFeatures.menu) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "menuHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "menuHint");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.menuHeading}
              selected={selectedKey === "menuHeading"}
              onSelect={() => selectKey("menuHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.menuHeading}
                onChange={(text) => updateDraft({ menuHeading: text })}
                placeholder="Menü"
                onFocus={() => setSelectedKey("menuHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.menuHint}
              selected={selectedKey === "menuHint"}
              onSelect={() => selectKey("menuHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.menuHint}
                onChange={(text) => updateDraft({ menuHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("menuHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-chips">
              {["Vorspeise", "Hauptgang", "Dessert"].map((label) => (
                <span key={label} style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        );
      }
      case "thank-you-card": {
        if (!draft.extraFeatures["thank-you-card"]) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "thankYouHeading");
        const messageOverride = elementOverrideStyle(draft.elements, "thankYouMessage");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.thankYouHeading}
              selected={selectedKey === "thankYouHeading"}
              onSelect={() => selectKey("thankYouHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.thankYouHeading}
                onChange={(text) => updateDraft({ thankYouHeading: text })}
                placeholder="Danke euch von Herzen"
                onFocus={() => setSelectedKey("thankYouHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.thankYouMessage}
              selected={selectedKey === "thankYouMessage"}
              onSelect={() => selectKey("thankYouMessage")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.thankYouMessage}
                onChange={(text) => updateDraft({ thankYouMessage: text })}
                placeholder={`Danke, dass ihr diesen Tag mit uns gefeiert habt! — ${draft.text || "euch"}`}
                onFocus={() => setSelectedKey("thankYouMessage")}
                style={{ fontSize: 10.5, color: draft.primary, opacity: 0.85, ...messageOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-info-line" style={{ color: draft.primary, opacity: 0.6, marginTop: 6 }}>
              Erscheint automatisch nach dem Fest
            </div>
          </div>
        );
      }
      case "audio-invitation": {
        if (!draft.extraFeatures["audio-invitation"]) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "audioInvitationHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "audioInvitationHint");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.audioInvitationHeading}
              selected={selectedKey === "audioInvitationHeading"}
              onSelect={() => selectKey("audioInvitationHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.audioInvitationHeading}
                onChange={(text) => updateDraft({ audioInvitationHeading: text })}
                placeholder="Eine Nachricht für euch"
                onFocus={() => setSelectedKey("audioInvitationHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.audioInvitationHint}
              selected={selectedKey === "audioInvitationHint"}
              onSelect={() => selectKey("audioInvitationHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.audioInvitationHint}
                onChange={(text) => updateDraft({ audioInvitationHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("audioInvitationHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
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
          </div>
        );
      }
      case "video-invitation": {
        if (!draft.extraFeatures["video-invitation"]) return null;
        const headingOverride = elementOverrideStyle(draft.elements, "videoMessageHeading");
        const hintOverride = elementOverrideStyle(draft.elements, "videoMessageHint");
        return (
          <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }} key={key}>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.videoMessageHeading}
              selected={selectedKey === "videoMessageHeading"}
              onSelect={() => selectKey("videoMessageHeading")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.videoMessageHeading}
                onChange={(text) => updateDraft({ videoMessageHeading: text })}
                placeholder="Unsere Videobotschaft"
                onFocus={() => setSelectedKey("videoMessageHeading")}
                style={{ color: draft.primary, ...headingOverride }}
              />
            </SelectableElement>
            <SelectableElement
              kind="text"
              label={TEXT_ELEMENT_LABELS.videoMessageHint}
              selected={selectedKey === "videoMessageHint"}
              onSelect={() => selectKey("videoMessageHint")}
              style={{ display: "block" }}
            >
              <InlineEditableField
                value={draft.videoMessageHint}
                onChange={(text) => updateDraft({ videoMessageHint: text })}
                placeholder="Hinweistext hinzufügen…"
                onFocus={() => setSelectedKey("videoMessageHint")}
                style={{ fontSize: 10, marginBottom: 8, color: draft.primary, opacity: 0.8, ...hintOverride }}
              />
            </SelectableElement>
            <div className="customizer-card-play-mock" style={{ borderColor: `${draft.accent}88` }}>
              <span className="customizer-card-play-btn" style={{ background: draft.accent, color: draft.background }}>
                ▶
              </span>
              <span style={{ color: draft.primary, fontSize: 10.5 }}>Videobotschaft ansehen</span>
            </div>
          </div>
        );
      }
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
          <AgendaList
            items={draft.agendaItems}
            selectedId={selectedAgendaId}
            onSelect={selectAgendaItem}
            onAdd={addAgendaItem}
            onRemove={removeAgendaItem}
            onMove={moveAgendaItemHandler}
            baseStyle={{ color: draft.primary }}
            accentColor={draft.accent}
          />
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
    // Bugfix: drafts[item.id] ist nur gefuellt, sobald tatsaechlich per
    // updateDraft() etwas geaendert wurde. Bei einem komplett unangetasteten
    // Entwurf (Kunde uebernimmt die Vorlage 1:1) blieb `drafts` leer und
    // saveDrafts(drafts) persistierte dann nichts unter item.id —
    // ApplyPendingDraft.tsx fand nach dem Login keinen Eintrag mehr und
    // brach ab, ohne ein Event zu erzeugen. Deshalb hier ausdruecklich den
    // bereits angezeigten, vollstaendig gemergten `draft` (defaultDraft() +
    // evtl. Aenderungen) unter item.id ablegen statt des rohen States.
    const next = { ...drafts, [item.id]: draft };
    setDrafts(next);
    saveDrafts(next);
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

  // Editor-Konsistenz-Auftrag, Teil A — Umschlag-Video/Musik/Audio-/Video-
  // Einladung ueber die anonyme upload-media/route.ts. anonymousDraftId wird
  // beim allerersten Upload einmalig erzeugt und im Draft persistiert (siehe
  // Draft-Typ oben) — bleibt danach fuer weitere Uploads/beim Signup stabil.
  const draftMediaField = {
    "envelope-video": "envelopeVideoUrl",
    "background-music": "backgroundMusicUrl",
    "audio-invitation": "audioInvitationUrl",
    "video-message": "videoMessageUrl",
  } as const;
  type DraftMediaKind = keyof typeof draftMediaField;
  async function uploadDraftMedia(kind: DraftMediaKind, file: File) {
    setUploadingKind(kind);
    setUploadError(null);
    try {
      let draftId = draft.anonymousDraftId;
      if (!draftId) {
        draftId = crypto.randomUUID();
        updateDraft({ anonymousDraftId: draftId });
      }
      const formData = new FormData();
      formData.set("draftId", draftId);
      formData.set("kind", kind);
      formData.set("file", file);
      const response = await fetch("/gestalten/upload-media", { method: "POST", body: formData });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.ok) throw new Error(json?.error === "too-large" ? "too-large" : "failed");
      updateDraft({ [draftMediaField[kind]]: json.url } as Partial<Draft>);
    } catch (err) {
      const tooLarge = err instanceof Error && err.message === "too-large";
      setUploadError({
        kind,
        message: tooLarge
          ? `Datei ist zu groß (max. ${kind === "background-music" || kind === "audio-invitation" ? "8" : "25"} MB).`
          : "Der Upload ist gerade nicht möglich. Bitte später erneut versuchen.",
      });
    } finally {
      setUploadingKind(null);
    }
  }
  function removeDraftMedia(kind: DraftMediaKind) {
    const draftId = draft.anonymousDraftId;
    updateDraft({ [draftMediaField[kind]]: null } as Partial<Draft>);
    if (!draftId) return;
    fetch("/gestalten/upload-media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, kind }),
    }).catch(() => {});
  }

  // Gemeinsames Rendering fuer alle vier Upload-Tabs (Umschlag/Musik/Audio-
  // /Video-Einladung) — gleiche Struktur, nur Titel/Hinweis/erlaubte Typen/
  // Groessenlimit unterscheiden sich je Tab.
  function renderMediaUploadTab(kind: DraftMediaKind, title: string, hint: string, accept: string, maxSizeMb: number) {
    const url = draft[draftMediaField[kind]];
    const isVideo = kind === "envelope-video" || kind === "video-message";
    const isUploading = uploadingKind === kind;
    return (
      <section className="studio-section">
        <h4>{title}</h4>
        <p className="studio-section-intro">{hint}</p>
        {url ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isVideo ? (
              <video src={url} controls style={{ width: "100%", maxHeight: 220, background: "#000" }} />
            ) : (
              <audio src={url} controls style={{ width: "100%" }} />
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => removeDraftMedia(kind)}
              style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 12.5 }}
            >
              Entfernen
            </button>
          </div>
        ) : (
          <>
            <FileField
              name="file"
              accept={accept}
              label={isUploading ? "Wird hochgeladen …" : "Datei auswählen"}
              colors={{ primary: draft.primary, accent: draft.accent, background: draft.background }}
              onFileSelected={(file) => uploadDraftMedia(kind, file)}
            />
            <span className="customizer-hint">Max. {maxSizeMb} MB.</span>
          </>
        )}
        {uploadError?.kind === kind && <p style={{ fontSize: 11.5, color: "#B2543A", marginTop: 6 }}>{uploadError.message}</p>}
      </section>
    );
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
                        {renderLocation({ color: draft.primary })}
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
                    {renderLocation({ color: draft.primary })}
                  </>
                )}

                {/* Google Maps/Kalender sind feste UI-Chrome-Elemente, keine
                    umschalt-/sortierbaren Paket-Module — bleiben deshalb
                    ausserhalb der sectionOrder-Liste, direkt unter dem
                    Kopfbereich. */}
                <div className="customizer-card-actions">
                  {draft.locationText ? (
                    <a
                      href={googleMapsSearchUrl([draft.locationText])}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderColor: `${draft.accent}88`, color: draft.primary }}
                    >
                      Google Maps
                    </a>
                  ) : (
                    <span style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>Google Maps</span>
                  )}
                  <SelectableElement
                    kind="text"
                    label={TEXT_ELEMENT_LABELS.calendarSaveText}
                    selected={selectedKey === "calendarSaveText"}
                    onSelect={() => selectKey("calendarSaveText")}
                  >
                    <InlineEditableField
                      value={draft.calendarSaveText}
                      onChange={(text) => updateDraft({ calendarSaveText: text })}
                      placeholder="In Kalender speichern"
                      onFocus={() => setSelectedKey("calendarSaveText")}
                      as="span"
                      style={{ borderColor: `${draft.accent}88`, color: draft.primary, ...elementOverrideStyle(draft.elements, "calendarSaveText") }}
                    />
                  </SelectableElement>
                  <SelectableElement
                    kind="text"
                    label={TEXT_ELEMENT_LABELS.calendarGoogleText}
                    selected={selectedKey === "calendarGoogleText"}
                    onSelect={() => selectKey("calendarGoogleText")}
                  >
                    <InlineEditableField
                      value={draft.calendarGoogleText}
                      onChange={(text) => updateDraft({ calendarGoogleText: text })}
                      placeholder="Google Kalender"
                      onFocus={() => setSelectedKey("calendarGoogleText")}
                      as="span"
                      style={{
                        background: draft.accent,
                        borderColor: draft.accent,
                        color: draft.background,
                        ...elementOverrideStyle(draft.elements, "calendarGoogleText"),
                      }}
                    />
                  </SelectableElement>
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

        <div className={`studio-panel-sticky${hasSelection && activeTab === "design" ? " mobile-edit-sheet-open" : ""}`}>
          {hasSelection && activeTab === "design" && (
            <button type="button" className="mobile-sheet-close" onClick={deselectAll} aria-label="Bearbeitung schließen">
              ✕
            </button>
          )}
          <div className="studio-panel-scroll">
          <ContextPanel tabs={PANEL_TABS} activeTabId={activeTab} onTabChange={setActiveTab}>
          {activeTab === "design" && (
        <>
          {selectedAgendaId ? (
            (() => {
              const item = draft.agendaItems.find((it) => it.id === selectedAgendaId);
              if (!item) return null;
              return (
                <section className="studio-section">
                  <TextControls
                    elementKey="agenda"
                    label={TEXT_ELEMENT_LABELS.agenda}
                    style={item.style ?? {}}
                    defaultColor={draft.primary}
                    onChange={(patch) => updateAgendaItemStyle(item.id, patch)}
                    onDeselect={() => setSelectedAgendaId(undefined)}
                  />
                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                    <AgendaItemQuickEdit
                      time={item.time}
                      label={item.label}
                      onChange={(patch) => updateAgendaItem(item.id, patch)}
                    />
                    <button
                      type="button"
                      onClick={() => removeAgendaItem(item.id)}
                      className="btn btn-ghost"
                      style={{ marginTop: 12, padding: "8px 14px", fontSize: 12, width: "100%" }}
                    >
                      Eintrag löschen
                    </button>
                  </div>
                </section>
              );
            })()
          ) : selectedWishlistId ? (
            (() => {
              const item = draft.wishlistItems.find((it) => it.id === selectedWishlistId);
              if (!item) return null;
              return (
                <section className="studio-section">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <h4 style={{ margin: 0 }}>Wunschlisten-Artikel</h4>
                    <button
                      type="button"
                      onClick={() => setSelectedWishlistId(undefined)}
                      style={{ fontSize: 11, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Abwählen
                    </button>
                  </div>
                  <WishlistItemQuickEdit
                    type={item.type}
                    title={item.title}
                    description={item.description}
                    url={item.url}
                    onChange={(patch) => updateWishlistItem(item.id, patch)}
                  />
                  <button
                    type="button"
                    onClick={() => removeWishlistItem(item.id)}
                    className="btn btn-ghost"
                    style={{ marginTop: 12, padding: "8px 14px", fontSize: 12, width: "100%" }}
                  >
                    Artikel löschen
                  </button>
                </section>
              );
            })()
          ) : selectedKey === "date" ? (
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
          ) : selectedKey === "location" ? (
            <section className="studio-section">
              <TextControls
                elementKey="location"
                label={TEXT_ELEMENT_LABELS.location}
                style={draft.elements?.location ?? {}}
                defaultColor={draft.primary}
                onChange={(patch) => updateElementStyle("location", patch)}
                onDeselect={() => setSelectedKey(undefined)}
              />
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: "var(--ink-faint)" }} htmlFor={`location-${item.id}`}>
                  Adresse
                </label>
                <PlaceAutocompleteField
                  id={`location-${item.id}`}
                  apiKey={GOOGLE_MAPS_API_KEY}
                  value={draft.locationText}
                  placeholder="z. B. Dedeman Sarayı, Bremen"
                  onChange={(text) => updateDraft({ locationText: text, locationLat: null, locationLng: null })}
                  onPlaceSelected={(place) => updateDraft({ locationText: place.address, locationLat: place.lat, locationLng: place.lng })}
                  style={{ padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13, width: "100%" }}
                />
              </div>
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
          ) : (
            <section className="studio-section">
              <p className="studio-section-intro">
                Name/Titel, Anlass-Label, Familiennamen, Datum und Ort direkt in der Karte anklicken und bearbeiten.
              </p>
            </section>
          )}

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
          {activeTab === "envelope" &&
            renderMediaUploadTab(
              "envelope-video",
              "Umschlag-Video",
              "Spielt beim Antippen des Umschlags statt der Standard-Öffnen-Animation.",
              "video/mp4,video/quicktime,video/webm",
              25
            )}
          {activeTab === "music" &&
            renderMediaUploadTab(
              "background-music",
              "Hintergrundmusik",
              "Läuft in einer Schleife, sobald Gäste sie über einen Schalter auf der Einladungsseite selbst einschalten — kein Autoplay.",
              "audio/mpeg,audio/mp4,audio/wav,audio/ogg",
              8
            )}
          {activeTab === "audio-invitation" &&
            renderMediaUploadTab(
              "audio-invitation",
              "Audio-Einladung",
              "Eine kurze Sprachnachricht als persönliche Einladung, die Gäste sich einmalig anhören können.",
              "audio/mpeg,audio/mp4,audio/wav,audio/ogg",
              8
            )}
          {activeTab === "video-message" &&
            renderMediaUploadTab(
              "video-message",
              "Video-Einladung",
              "Eine eigenständige Videobotschaft in einem separaten Bereich der Einladungsseite — unabhängig vom Umschlag-Video.",
              "video/mp4,video/quicktime,video/webm",
              25
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
