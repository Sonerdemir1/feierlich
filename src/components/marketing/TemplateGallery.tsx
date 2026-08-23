"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";

type Colors = { primary: string; accent: string; background: string };

export type GalleryTemplate = {
  id: string;
  name: string;
  layoutKey: string;
  priceCents: number;
  colors: Colors;
  defaultText: string;
};

export type GalleryCategory = {
  category: string;
  subtitle: string;
  items: GalleryTemplate[];
};

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

type FontOption = { id: string; label: string; cssVar: string; italic?: boolean; uppercase?: boolean };

const FONT_OPTIONS: FontOption[] = [
  { id: "cormorant", label: "Cormorant", cssVar: "var(--font-display)", italic: true },
  { id: "playfair", label: "Playfair", cssVar: "var(--font-playfair)" },
  { id: "cinzel", label: "Cinzel", cssVar: "var(--font-cinzel)", uppercase: true },
  { id: "script", label: "Skript", cssVar: "var(--font-script)" },
  { id: "worksans", label: "Work Sans", cssVar: "var(--font-body)" },
  { id: "poppins", label: "Poppins", cssVar: "var(--font-poppins)" },
];

type Draft = {
  text: string;
  fontId: string;
  fontSize: number;
  accent: string;
  background: string;
  image: string | null;
};

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
    fontId: "cormorant",
    fontSize: 26,
    accent: item.colors.accent,
    background: item.colors.background,
    image: null,
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
  // Lazy initializer statt Effect: laeuft einmalig bei Mount, liest
  // sicher {} waehrend SSR (loadDrafts prueft `typeof window`). Der
  // Entwurf beeinflusst nie den initialen Render (Panel startet immer
  // geschlossen), daher kein Hydration-Mismatch-Risiko.
  const [drafts, setDrafts] = useState<Record<string, Draft>>(loadDrafts);
  const [savedHint, setSavedHint] = useState(false);

  function draftFor(item: GalleryTemplate): Draft {
    return drafts[item.id] ?? defaultDraft(item);
  }

  function updateDraft(item: GalleryTemplate, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const base = prev[item.id] ?? defaultDraft(item);
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

  return (
    <>
      {categories.map(({ category, subtitle, items }) => (
        <div className="cat" key={category}>
          <div className="cat-head">
            <h3>{category}</h3>
            <span className="cat-sub">{subtitle}</span>
          </div>
          <div className="cat-grid">
            {items.map((item) => {
              const isOpen = openId === item.id;
              const draft = draftFor(item);
              const font = FONT_OPTIONS.find((f) => f.id === draft.fontId) ?? FONT_OPTIONS[0];

              return (
                <Fragment key={item.id}>
                  <button
                    type="button"
                    className={`tpl${isOpen ? " is-open" : ""}`}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="tpl-open-hint">{isOpen ? "Schließen" : "Design anpassen"}</span>
                    <TemplatePreview layoutKey={item.layoutKey} />
                    <span className="tpl-label">
                      <span>{item.name}</span>
                      {item.priceCents > 0 && <span className="tpl-price">{eur.format(item.priceCents / 100)}</span>}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="customizer" key={`${item.id}-customizer`}>
                      <div className="customizer-preview">
                        <div
                          className="customizer-card"
                          style={{ background: draft.background, borderColor: `${draft.accent}55` }}
                        >
                          {draft.image && (
                            // eslint-disable-next-line @next/next/no-img-element -- user upload (data URL), unknown dimensions
                            <img src={draft.image} alt="" />
                          )}
                          <div
                            style={{
                              fontFamily: font.cssVar,
                              fontStyle: font.italic ? "italic" : "normal",
                              textTransform: font.uppercase ? "uppercase" : "none",
                              fontSize: draft.fontSize,
                              color: draft.accent,
                              lineHeight: 1.15,
                              wordBreak: "break-word",
                            }}
                          >
                            {draft.text || item.defaultText}
                          </div>
                        </div>
                        <button type="button" className="customizer-close" onClick={() => setOpenId(null)}>
                          Vorschau schließen
                        </button>
                      </div>

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
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
