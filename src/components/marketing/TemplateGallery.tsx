"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { TemplatePreview, CornerMotif, DotScatter, NazarScatter } from "@/components/marketing/TemplatePreview";
import { FONT_OPTIONS } from "@/lib/fonts";
import { cardTextZone } from "@/lib/card-frames";

type Colors = { primary: string; accent: string; background: string };

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

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

// Muss exakt zur gleichnamigen Funktion in src/app/page.tsx passen (beide
// erzeugen dieselben Anker-IDs) — bewusst dupliziert statt geteilt, gleiches
// Muster wie die anderen lokalen `slugify`-Helfer im Projekt.
function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
  dateText: string;
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

// Zusaetzliche VIP-Funktionen, kompakt als Chips statt als eigene grosse
// Kartenabschnitte — sonst waechst die Karte ins Unendliche. Countdown,
// Zusagen, Sitzplan und Galerie bleiben die einzigen mit eigenem grossen
// Vorschau-Block, weil sie die auffaelligsten/haeufigsten sind.
const EXTRA_FEATURES: { key: string; label: string }[] = [
  { key: "agenda", label: "Ablaufplan" },
  { key: "guestbook", label: "Gästebuch" },
  { key: "dresscode", label: "Dresscode" },
  { key: "social-media", label: "Social Media" },
  { key: "menu", label: "Digitale Menükarte" },
  { key: "wishlist", label: "Wunschliste" },
  { key: "music-requests", label: "Musikwünsche" },
  { key: "thank-you-card", label: "Digitale Dankeskarte" },
  { key: "audio-invitation", label: "Audio-Einladung" },
  { key: "video-invitation", label: "Video-Einladung" },
];

const STORAGE_KEY = "einladi:design-drafts:v1";
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
    dateText: "",
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
  };
}

function saveDrafts(drafts: Record<string, Draft>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // localStorage voll oder deaktiviert — Entwurf bleibt nur im Speicher dieser Sitzung.
  }
}

export function TemplateGallery({ categories }: { categories: GalleryCategory[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  // Vollbild-Vorschau startet immer geschlossen (nur die Karte, gross und
  // mittig) — das Formular blendet man sich bewusst per "Bearbeiten" ein,
  // statt es immer daneben stehen zu haben. Passt zum Vorbild: erst die
  // Karte in Ruhe ansehen, dann editieren.
  const [formOpen, setFormOpen] = useState(false);
  // Lazy initializer statt Effect: laeuft einmalig bei Mount, liest
  // sicher {} waehrend SSR (loadDrafts prueft `typeof window`). Der
  // Entwurf beeinflusst nie den initialen Render (Panel startet immer
  // geschlossen), daher kein Hydration-Mismatch-Risiko.
  const [drafts, setDrafts] = useState<Record<string, Draft>>(loadDrafts);
  const [savedHint, setSavedHint] = useState(false);

  const flatItems = categories.flatMap((c) => c.items.map((item) => ({ item, category: c.category })));

  function openItem(id: string) {
    setOpenId(id);
    setFormOpen(false);
  }

  function closeOverlay() {
    setOpenId(null);
    setFormOpen(false);
  }

  function step(dir: 1 | -1) {
    const idx = flatItems.findIndex((f) => f.item.id === openId);
    if (idx === -1) return;
    const next = flatItems[(idx + dir + flatItems.length) % flatItems.length];
    setOpenId(next.item.id);
    setFormOpen(false);
  }

  // Esc schliesst die Vollbild-Vorschau, Body-Scroll wird gesperrt solange
  // sie offen ist — sonst scrollt die Seite dahinter unsichtbar mit.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openId]);

  // Merge statt reinem Fallback: ein in localStorage gespeicherter Entwurf
  // aus einer aelteren Version (vor neuen Draft-Feldern wie showFloral)
  // soll die neuen Felder aus dem Default ziehen, nicht stillschweigend
  // als "aus" gelten.
  // Deep-mergt extraFeatures mit, statt es 1:1 aus einem aelteren Entwurf
  // zu uebernehmen — sonst fehlt ein spaeter hinzugefuegtes Feature bei
  // Bestandsentwuerfen wieder stillschweigend.
  function mergedDraft(item: GalleryTemplate, saved?: Draft): Draft {
    const base = defaultDraft(item);
    if (!saved) return base;
    return { ...base, ...saved, extraFeatures: { ...base.extraFeatures, ...saved.extraFeatures } };
  }

  function draftFor(item: GalleryTemplate): Draft {
    return mergedDraft(item, drafts[item.id]);
  }

  function updateDraft(item: GalleryTemplate, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = mergedDraft(item, prev[item.id]);
      const next = { ...prev, [item.id]: { ...base, ...patch } };
      saveDrafts(next);
      return next;
    });
    setSavedHint(false);
  }

  function handleImageFile(item: GalleryTemplate, file: File | null) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      alert("Bild ist zu groß (max. 2,5 MB) für die Vorschau ohne Konto.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateDraft(item, { image: String(reader.result) });
    reader.readAsDataURL(file);
  }

  const activeEntry = flatItems.find((f) => f.item.id === openId) ?? null;

  return (
    <>
      <div className="tpl-filter-row">
        {categories.map(({ category }) => (
          <a key={category} href={`#cat-${categorySlug(category)}`} className="tpl-filter-pill">
            {category}
          </a>
        ))}
      </div>

      {categories.map(({ category, subtitle, items }) => (
        <div className="cat" key={category} id={`cat-${categorySlug(category)}`}>
          <div className="cat-head">
            <h3>{category}</h3>
            <span className="cat-sub">{subtitle}</span>
          </div>
          <div className="cat-grid">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tpl${openId === item.id ? " is-open" : ""}`}
                onClick={() => openItem(item.id)}
                aria-expanded={openId === item.id}
              >
                <span className="tpl-open-hint">Design anpassen</span>
                <TemplatePreview layoutKey={item.layoutKey} />
                <span className="tpl-label">
                  <span>{item.name}</span>
                  {item.priceCents > 0 && <span className="tpl-price">{eur.format(item.priceCents / 100)}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {activeEntry &&
        (() => {
          const { item, category } = activeEntry;
          const draft = draftFor(item);
          const font = FONT_OPTIONS.find((f) => f.id === draft.fontId) ?? FONT_OPTIONS[0];
          const zone = item.cardImageUrl ? cardTextZone(item.layoutKey) : null;

          return (
            <div className="tpl-overlay" onClick={(e) => e.target === e.currentTarget && closeOverlay()}>
              <button type="button" className="tpl-overlay-close" onClick={closeOverlay} aria-label="Schließen">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <div className="tpl-overlay-stage">
                <div className="tpl-overlay-card-col">
                  <div key={item.id} className="tpl-overlay-card-anim">
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
                                justifyContent: "center",
                                textAlign: "center",
                              }}
                            >
                              <div className="customizer-card-eyebrow" style={{ color: draft.accent }}>
                                {draft.eventLabel || item.defaultEventLabel}
                              </div>
                              <div
                                className="customizer-card-name"
                                style={{
                                  fontFamily: font.cssVar,
                                  fontStyle: font.italic ? "italic" : "normal",
                                  textTransform: font.uppercase ? "uppercase" : "none",
                                  fontSize: draft.fontSize,
                                  color: draft.primary,
                                }}
                              >
                                {draft.text || item.defaultText}
                              </div>
                              <div className="customizer-card-date" style={{ color: draft.primary, marginTop: 8 }}>
                                {draft.dateText || "Datum & Uhrzeit"}
                              </div>
                              <div className="customizer-card-location" style={{ color: draft.primary }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill={draft.accent}>
                                  <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
                                </svg>
                                {draft.locationText || "Ort / Location eingeben"}
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

                            <div className="customizer-card-eyebrow" style={{ color: draft.accent }}>
                              {draft.eventLabel || item.defaultEventLabel}
                            </div>
                            <div
                              className="customizer-card-name"
                              style={{
                                fontFamily: font.cssVar,
                                fontStyle: font.italic ? "italic" : "normal",
                                textTransform: font.uppercase ? "uppercase" : "none",
                                fontSize: draft.fontSize,
                                color: draft.accent,
                              }}
                            >
                              {draft.text || item.defaultText}
                            </div>

                            {(draft.familyLeft || draft.familyRight) && (
                              <div className="customizer-card-families" style={{ color: draft.primary }}>
                                <div>
                                  <span>{draft.familyLeft || "—"}</span>
                                  <small>AİLESİ</small>
                                </div>
                                <div className="customizer-card-families-div" style={{ background: `${draft.accent}66` }} />
                                <div>
                                  <span>{draft.familyRight || "—"}</span>
                                  <small>AİLESİ</small>
                                </div>
                              </div>
                            )}

                            <div className="customizer-card-divider" style={{ background: draft.accent }} />
                            <div className="customizer-card-date" style={{ color: draft.primary }}>
                              {draft.dateText || "Datum & Uhrzeit"}
                            </div>
                            <div className="customizer-card-location" style={{ color: draft.primary }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill={draft.accent}>
                                <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
                              </svg>
                              {draft.locationText || "Ort / Location eingeben"}
                            </div>
                          </>
                        )}

                            {draft.showCountdown && (
                              <div className="customizer-card-countdown">
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
                            )}

                            <div className="customizer-card-actions">
                              <span style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                                Google Maps
                              </span>
                              <span
                                style={{ background: draft.accent, borderColor: draft.accent, color: draft.background }}
                              >
                                Kalender
                              </span>
                            </div>

                            {draft.showRsvp && (
                              <div className="customizer-card-rsvp" style={{ borderColor: `${draft.accent}66` }}>
                                <div style={{ color: draft.primary }}>Kommt ihr?</div>
                                <div>
                                  <span style={{ background: draft.accent, color: draft.background }}>Zusagen</span>
                                  <span style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                                    Absagen
                                  </span>
                                </div>
                              </div>
                            )}

                            {draft.showSeating && (
                              <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }}>
                                <div style={{ color: draft.primary }}>Sitzplan-Suche</div>
                                <div className="customizer-card-seating-input" style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                                  Euer Name …
                                </div>
                                <div className="customizer-card-seating-grid">
                                  {Array.from({ length: 8 }).map((_, i) => (
                                    <span
                                      key={i}
                                      style={
                                        i === 2
                                          ? { background: draft.accent }
                                          : { borderColor: `${draft.accent}55` }
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {draft.showGallery && (
                              <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }}>
                                <div style={{ color: draft.primary }}>Foto- &amp; Videogalerie</div>
                                <div className="customizer-card-gallery-grid">
                                  {[0.9, 0.6, 0.8, 0.5, 1, 0.7].map((o, i) => (
                                    <span key={i} style={{ background: draft.accent, opacity: o * 0.5 }} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {EXTRA_FEATURES.some((f) => draft.extraFeatures[f.key]) && (
                              <div className="customizer-card-section" style={{ borderColor: `${draft.accent}66` }}>
                                <div style={{ color: draft.primary }}>Weitere Funktionen</div>
                                <div className="customizer-card-chips">
                                  {EXTRA_FEATURES.filter((f) => draft.extraFeatures[f.key]).map((f) => (
                                    <span key={f.key} style={{ borderColor: `${draft.accent}88`, color: draft.primary }}>
                                      {f.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                    </div>
                  </div>
                {formOpen && (
                  <div className="tpl-overlay-form" onClick={(e) => e.stopPropagation()}>
                    <div className="customizer-form">
                      <div className="customizer-field">
                        <label htmlFor={`text-${item.id}`}>Name / Titel</label>
                          <input
                            id={`text-${item.id}`}
                            className="customizer-text-input"
                            type="text"
                            value={draft.text}
                            placeholder={item.defaultText}
                            onChange={(e) => updateDraft(item, { text: e.target.value })}
                          />
                        </div>

                        <div className="customizer-field">
                          <label htmlFor={`label-${item.id}`}>Anlass</label>
                          <input
                            id={`label-${item.id}`}
                            className="customizer-text-input"
                            type="text"
                            value={draft.eventLabel}
                            placeholder={item.defaultEventLabel}
                            onChange={(e) => updateDraft(item, { eventLabel: e.target.value })}
                          />
                        </div>

                        <div className="customizer-row">
                          <div className="customizer-field" style={{ flex: 1, minWidth: 160 }}>
                            <label htmlFor={`date-${item.id}`}>Datum &amp; Uhrzeit</label>
                            <input
                              id={`date-${item.id}`}
                              className="customizer-text-input"
                              type="text"
                              value={draft.dateText}
                              placeholder="z. B. 20. Juni 2026, 18 Uhr"
                              onChange={(e) => updateDraft(item, { dateText: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="customizer-field">
                          <label htmlFor={`location-${item.id}`}>Ort / Location</label>
                          <input
                            id={`location-${item.id}`}
                            className="customizer-text-input"
                            type="text"
                            value={draft.locationText}
                            placeholder="z. B. Dedeman Sarayı, Bremen"
                            onChange={(e) => updateDraft(item, { locationText: e.target.value })}
                          />
                          <span className="customizer-hint">
                            Google-Maps-Autovervollständigung folgt hier in Kürze.
                          </span>
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
                              onChange={(e) => updateDraft(item, { familyLeft: e.target.value })}
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
                              onChange={(e) => updateDraft(item, { familyRight: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="customizer-field">
                          <label>Schriftart</label>
                          <div className="customizer-fonts">
                            {FONT_OPTIONS.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                className={`customizer-font-btn${f.id === draft.fontId ? " is-active" : ""}`}
                                style={{
                                  fontFamily: f.cssVar,
                                  fontStyle: f.italic ? "italic" : "normal",
                                  textTransform: f.uppercase ? "uppercase" : "none",
                                }}
                                onClick={() => updateDraft(item, { fontId: f.id })}
                              >
                                Aa
                                <small>{f.label}</small>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="customizer-row">
                          <div className="customizer-field" style={{ flex: 1, minWidth: 180 }}>
                            <label htmlFor={`size-${item.id}`}>Schriftgröße</label>
                            <div className="customizer-slider">
                              <input
                                id={`size-${item.id}`}
                                type="range"
                                min={18}
                                max={40}
                                value={draft.fontSize}
                                onChange={(e) => updateDraft(item, { fontSize: Number(e.target.value) })}
                              />
                              <span style={{ fontSize: 12, color: "var(--ink-soft)", width: 28 }}>
                                {draft.fontSize}
                              </span>
                            </div>
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
                                onChange={(e) => updateDraft(item, { primary: e.target.value })}
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
                                onChange={(e) => updateDraft(item, { accent: e.target.value })}
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
                                onChange={(e) => updateDraft(item, { background: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="customizer-field">
                          <label>Eigenes Foto</label>
                          <div className="customizer-upload">
                            <label className="customizer-upload-btn">
                              {draft.image ? "Anderes Foto wählen" : "Foto hochladen"}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                style={{ display: "none" }}
                                onChange={(e) => handleImageFile(item, e.target.files?.[0] ?? null)}
                              />
                            </label>
                            {draft.image && (
                              <button
                                type="button"
                                className="customizer-upload-remove"
                                onClick={() => updateDraft(item, { image: null })}
                              >
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
                                  onClick={() => updateDraft(item, { photoShape: s.id })}
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
                              <input
                                type="checkbox"
                                checked={draft.showFloral}
                                onChange={(e) => updateDraft(item, { showFloral: e.target.checked })}
                              />
                              Floral-Muster
                            </label>
                            <label className="customizer-toggle">
                              <input
                                type="checkbox"
                                checked={draft.showOrnaments}
                                onChange={(e) => updateDraft(item, { showOrnaments: e.target.checked })}
                              />
                              Eck-Ornamente &amp; Streumuster
                            </label>
                            {item.photoBackground && (
                              <label className="customizer-toggle">
                                <input
                                  type="checkbox"
                                  checked={draft.showPhotoBackground}
                                  onChange={(e) => updateDraft(item, { showPhotoBackground: e.target.checked })}
                                />
                                Foto-Hintergrund
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="customizer-field">
                          <label>Funktionen</label>
                          <div className="customizer-toggles">
                            <label className="customizer-toggle">
                              <input
                                type="checkbox"
                                checked={draft.showCountdown}
                                onChange={(e) => updateDraft(item, { showCountdown: e.target.checked })}
                              />
                              Countdown
                              <span className="customizer-tier-badge">ab {FEATURE_TIER.countdown}</span>
                            </label>
                            <label className="customizer-toggle">
                              <input
                                type="checkbox"
                                checked={draft.showRsvp}
                                onChange={(e) => updateDraft(item, { showRsvp: e.target.checked })}
                              />
                              Zusagen-Bereich
                              <span className="customizer-tier-badge">ab {FEATURE_TIER.rsvp}</span>
                            </label>
                            <label className="customizer-toggle">
                              <input
                                type="checkbox"
                                checked={draft.showSeating}
                                onChange={(e) => updateDraft(item, { showSeating: e.target.checked })}
                              />
                              Sitzplan-Suche
                              <span className="customizer-tier-badge">ab {FEATURE_TIER.seating}</span>
                            </label>
                            <label className="customizer-toggle">
                              <input
                                type="checkbox"
                                checked={draft.showGallery}
                                onChange={(e) => updateDraft(item, { showGallery: e.target.checked })}
                              />
                              Foto- &amp; Videogalerie
                              <span className="customizer-tier-badge">ab {FEATURE_TIER.gallery}</span>
                            </label>
                            {EXTRA_FEATURES.map((f) => (
                              <label className="customizer-toggle" key={f.key}>
                                <input
                                  type="checkbox"
                                  checked={draft.extraFeatures[f.key] ?? true}
                                  onChange={(e) =>
                                    updateDraft(item, {
                                      extraFeatures: { ...draft.extraFeatures, [f.key]: e.target.checked },
                                    })
                                  }
                                />
                                {f.label}
                                <span className="customizer-tier-badge">ab {FEATURE_TIER[f.key]}</span>
                              </label>
                            ))}
                          </div>
                          <span className="customizer-hint">
                            Alle Funktionen sind hier zur Ansicht aktiv — welches Paket ihr braucht, hängt davon ab,
                            was ihr am Ende nutzen wollt.
                          </span>
                        </div>

                        <div className="customizer-cta">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              saveDrafts(drafts);
                              setSavedHint(true);
                              router.push("/login");
                            }}
                          >
                            Design speichern &amp; Konto erstellen
                          </button>
                        {savedHint && <span className="customizer-saved">Gespeichert — geht gleich weiter.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="tpl-overlay-bar">
                <button type="button" onClick={closeOverlay}>
                  Zurück
                </button>
                <button type="button" onClick={() => step(-1)} aria-label="Vorheriges Design">
                  ‹
                </button>
                <button
                  type="button"
                  className="tpl-overlay-bar-primary"
                  onClick={() => setFormOpen((f) => !f)}
                >
                  {formOpen ? "Vorschau" : "Bearbeiten"}
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Nächstes Design">
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveDrafts(drafts);
                    setSavedHint(true);
                    router.push("/login");
                  }}
                >
                  Übernehmen
                </button>
              </div>
            </div>
          );
        })()}
    </>
  );
}
