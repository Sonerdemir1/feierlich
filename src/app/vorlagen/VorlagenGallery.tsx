"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { TemplateGallery, type GalleryCategory } from "@/components/marketing/TemplateGallery";
import { TURKISH_CATEGORIES } from "@/lib/gallery-templates";
import "@/components/marketing/zera/zera.css";

// Zwei feste Farbwerte, unabhaengig von der Zera-Palette (MOTION.md §1) —
// leben laut §3 "ausschliesslich innerhalb der Galerie-Kacheln". Dieselben
// Werte wie das (inzwischen ungenutzte) --henna/--sage aus der alten
// "Tinte & Kerzenlicht"-Palette in globals.css .motion-home, damit die
// Zweigfarben im Produkt konsistent bleiben, auch wenn dieser Mechanismus
// hier unabhaengig/neu aufgebaut ist (kein Wiederverwenden von totem
// .motion-home-CSS).
const BRANCH_ACCENT = { all: "#B89968", tr: "#8E2C3B", de: "#6C7A63" } as const;
const BRANCH_LABEL = { all: "Alle", tr: "Türkisch", de: "Deutsch" } as const;
type Branch = keyof typeof BRANCH_ACCENT;

// Volle Vorlagen-Galerie, ausgelagert aus Kapitel 04 der Startseite
// (siehe CuratedTemplates.tsx dort) — nutzt dieselbe Zera-Palette/
// Typografie (docs/MOTION.md §1), aber keinen Kapitel-Rahmen (Nummer/
// Paginierung/"Weiter"), da diese Seite kein Kapitel im erzaehlten
// Startseiten-Fluss ist, sondern ein eigenstaendiges Ziel zum Stoebern.
//
// Zweig-Umschalter (MOTION.md §3: "ein Systemwechsel, kein Filter-Klick")
// startet bewusst bei "Alle" statt bei einem der beiden Zweige — ein
// Erstbesuch soll nicht die Haelfte des Katalogs ausblenden, bevor der
// Mensch ueberhaupt weiss, dass es die Umschaltung gibt. Tuerkisch/
// Deutsch sind eine explizite Vertiefung obendrauf, kein Pflicht-Schritt.
export function VorlagenGallery({ categories, paket }: { categories: GalleryCategory[]; paket?: string }) {
  const [branch, setBranch] = useState<Branch>("all");
  const total = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const visible =
    branch === "all" ? categories : categories.filter((cat) => TURKISH_CATEGORIES.has(cat.category) === (branch === "tr"));
  const accent = BRANCH_ACCENT[branch];

  return (
    <div className="zc-page" style={{ "--vg-accent": accent, transition: "background-color 600ms ease" } as CSSProperties}>
      <header className="zc-nav">
        <Link href="/" className="zc-nav-logo">
          einladi
        </Link>
        <nav className="zc-nav-links">
          <Link href="/#kapitel-02">Fotos &amp; Gästebuch</Link>
          <Link href="/vorlagen">Vorlagen</Link>
          <Link href="/#preise">Preise</Link>
          <Link href="/dashboard">Anmelden</Link>
        </nav>
        <div className="zc-nav-right">
          <Link href="/dashboard" className="zc-btn zc-btn-primary">
            Fotos &amp; Videos sammeln
          </Link>
        </div>
      </header>

      <div className="zc-full" style={{ paddingTop: "clamp(40px, 6vw, 72px)" }}>
        <div className="zc-centered-head">
          <span className="zc-eyebrow">Vorlagen</span>
          <h1 className="zc-heading">ALLE {total} VORLAGEN</h1>
          <p className="zc-sub" style={{ margin: "0 auto" }}>
            Für jede Stimmung, jeden Anlass, jede Kultur — nach Kategorie sortiert. Design anpassen, direkt in Echtzeit.
          </p>
        </div>

        <div className="vg-branch-switch" role="tablist" aria-label="Vorlagen-Zweig">
          {(Object.keys(BRANCH_ACCENT) as Branch[]).map((b) => (
            <button
              key={b}
              type="button"
              role="tab"
              aria-selected={branch === b}
              className={`vg-branch-btn${branch === b ? " is-active" : ""}`}
              style={{ "--vg-btn-accent": BRANCH_ACCENT[b] } as CSSProperties}
              onClick={() => setBranch(b)}
            >
              {BRANCH_LABEL[b]}
            </button>
          ))}
        </div>

        <TemplateGallery categories={visible} locale="de" paket={paket} accentColor={accent} />
      </div>

      <footer className="zc-footer">
        <div>
          <p className="zc-footer-tagline">Digitale Einladungen und Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und Business-Events.</p>
        </div>
        <nav className="zc-footer-links">
          <Link href="/kontakt">Kontakt</Link>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
        </nav>
      </footer>
    </div>
  );
}
