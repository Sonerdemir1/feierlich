"use client";

import Link from "next/link";
import { TemplateGallery, type GalleryCategory } from "@/components/marketing/TemplateGallery";
import "@/components/marketing/zera/zera.css";

// Volle Vorlagen-Galerie, ausgelagert aus Kapitel 04 der Startseite
// (siehe CuratedTemplates.tsx dort) — nutzt dieselbe Zera-Palette/
// Typografie (docs/MOTION.md §1), aber keinen Kapitel-Rahmen (Nummer/
// Paginierung/"Weiter"), da diese Seite kein Kapitel im erzaehlten
// Startseiten-Fluss ist, sondern ein eigenstaendiges Ziel zum Stoebern.
export function VorlagenGallery({ categories, paket }: { categories: GalleryCategory[]; paket?: string }) {
  const total = categories.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="zc-page">
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
        <TemplateGallery categories={categories} locale="de" paket={paket} />
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
