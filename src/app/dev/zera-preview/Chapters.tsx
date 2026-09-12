"use client";

// Scratch-Vorschau, NICHT Teil des Produkts — alle Kapitel des Zera-
// Studio-artigen Homepage-Umbaus. Eigenstaendige Route, ruehrt die echte
// Startseite (src/app/page.tsx) noch nicht an. Deutsch-only, siehe
// docs/MOTION.md §0.
import "./zera.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { GalleryPreview, GuestPagePreview, SharePreview } from "@/components/marketing/PhoneMockups";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { TemplateGallery, type GalleryCategory } from "@/components/marketing/TemplateGallery";
import { homepageCopy } from "@/lib/translations/homepage";

const t = homepageCopy.de;
const EASE = [0.16, 1, 0.3, 1] as const;
const TOTAL_CHAPTERS = 8;

// Kapitel 1 ist beim Laden bereits sichtbar — dafuer gibt es nichts
// "hineinzuscrollen", die Elemente animieren direkt beim Einhaengen ein.
function mountReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: EASE } },
  };
}

// Ab Kapitel 2 sind die Elemente beim Laden noch ausserhalb des
// Bildschirms — hier feuert der echte Scroll-Trigger (docs/MOTION.md §2).
function scrollReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: EASE } },
    viewport: { once: true, amount: 0.2 },
  };
}

function ChapterShell({
  num,
  label,
  id,
  nextId,
  children,
}: {
  num: number;
  label: string;
  id: string;
  nextId?: string;
  children: ReactNode;
}) {
  return (
    <section className="zc-chapter" id={id}>
      <div className="zc-chapter-head">
        <span className="zc-chapter-num">({String(num).padStart(2, "0")})</span>
        <span className="zc-chapter-label">— {label}</span>
      </div>

      {children}

      <div className="zc-footer-bar">
        <div className="zc-pagination">
          <span>
            {String(num).padStart(2, "0")} / {String(TOTAL_CHAPTERS).padStart(2, "0")}
          </span>
          <span className="zc-pagination-track" style={{ ["--zc-progress" as string]: `${(num / TOTAL_CHAPTERS) * 100}%` }} />
        </div>
        {nextId ? (
          <a href={`#${nextId}`} className="zc-next">
            Weiter
            <span className="zc-next-arrow" aria-hidden="true">
              ↓
            </span>
          </a>
        ) : (
          <span className="zc-next" style={{ opacity: 0.35, cursor: "default" }}>
            Ende der Vorschau
          </span>
        )}
      </div>
    </section>
  );
}

export function Chapters({ categories }: { categories: GalleryCategory[] }) {
  return (
    <div className="zc-page">
      {/* Kapitel 01 — Hero */}
      <ChapterShell num={1} label="Willkommen" id="kapitel-01" nextId="kapitel-02">
        <div className="zc-body">
          <div>
            <motion.span className="zc-eyebrow" {...mountReveal(0)}>
              {t.hero.eyebrow}
            </motion.span>
            <motion.h1 className="zc-heading" {...mountReveal(0.08)}>
              EURE <span className="zc-accent-word">erinnerungen</span>.
              <br />
              NICHT VERSTREUT AUF FREMDEN HANDYS.
            </motion.h1>
            <motion.p className="zc-sub" {...mountReveal(0.16)}>
              {t.hero.sub}
            </motion.p>
            <motion.div className="zc-cta-row" {...mountReveal(0.24)}>
              <a href="#" className="zc-btn zc-btn-primary">
                {t.hero.ctaPrimary}
              </a>
              <a href="#" className="zc-btn zc-btn-ghost">
                {t.hero.ctaSecondary}
              </a>
            </motion.div>
          </div>

          <motion.div className="zc-pedestal" {...mountReveal(0.2)}>
            <div className="zc-pedestal-photo" style={{ backgroundImage: "url(/images/templates/grand-hall-dramatic.jpg)" }} />
          </motion.div>
        </div>
      </ChapterShell>

      {/* Kapitel 02 — Fotos, Videos & Gästebuch */}
      <ChapterShell num={2} label={t.erinnerungen.eyebrow} id="kapitel-02" nextId="kapitel-03">
        <div className="zc-body zc-body--reverse">
          <motion.div className="zc-pedestal" {...scrollReveal(0.1)}>
            <div className="zc-pedestal-frame">
              <GalleryPreview />
            </div>
          </motion.div>

          <div>
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.erinnerungen.eyebrow}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              ALLES, WAS EURE GÄSTE
              <br />
              <span className="zc-accent-word">festhalten</span> — AN EINEM ORT
            </motion.h2>
            <motion.p className="zc-sub" {...scrollReveal(0.16)}>
              {t.erinnerungen.desc}
            </motion.p>
            <motion.div className="zc-points" {...scrollReveal(0.22)}>
              {t.erinnerungen.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </ChapterShell>

      {/* Kapitel 03 — So funktioniert's */}
      <ChapterShell num={3} label={t.how.eyebrow} id="kapitel-03" nextId="kapitel-04">
        <div className="zc-full">
          <div className="zc-centered-head">
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.how.eyebrow}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              {t.how.heading.toUpperCase()}
            </motion.h2>
          </div>
          <motion.div className="zc-steps" {...scrollReveal(0.18)}>
            {t.how.steps.map((step, i) => (
              <div key={step.title}>
                <span className="zc-step-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="zc-step-title">{step.title}</div>
                <div className="zc-step-desc">{step.desc}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </ChapterShell>

      {/* Kapitel 04 — Vorlagen (volle Breite, eigene Kartenoptik siehe docs/MOTION.md §3) */}
      <ChapterShell num={4} label={t.nav.templates} id="kapitel-04" nextId="kapitel-05">
        <div className="zc-full">
          <div className="zc-centered-head">
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.nav.templates}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              {t.vorlagen.heading.toUpperCase()}
            </motion.h2>
            <motion.p className="zc-sub" style={{ margin: "0 auto" }} {...scrollReveal(0.16)}>
              {t.vorlagen.desc}
            </motion.p>
          </div>
          {/* Kein Motion-Fade hier — die Galerie ist zu gross fuer eine
              einzelne Sichtbarkeits-Schwelle (siehe Testlauf) und hat mit
              §3 ohnehin ihre eigene Kartenoptik/-animation. */}
          <TemplateGallery categories={categories} locale="de" />
        </div>
      </ChapterShell>

      {/* Kapitel 05 — Editor */}
      <ChapterShell num={5} label={t.editor.eyebrow} id="kapitel-05" nextId="kapitel-06">
        <div className="zc-body">
          <div>
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.editor.eyebrow}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              GESTALTEN <span className="zc-accent-word">in echtzeit</span>
            </motion.h2>
            <motion.p className="zc-sub" {...scrollReveal(0.16)}>
              {t.editor.desc}
            </motion.p>
            <motion.div className="zc-points" {...scrollReveal(0.22)}>
              {t.editor.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div className="zc-pedestal" {...scrollReveal(0.1)}>
            <div className="zc-pedestal-frame">
              <EditorPreview />
            </div>
          </motion.div>
        </div>
      </ChapterShell>

      {/* Kapitel 06 — Event-Webseite */}
      <ChapterShell num={6} label={t.eventpage.eyebrow} id="kapitel-06" nextId="kapitel-07">
        <div className="zc-body zc-body--reverse">
          <motion.div className="zc-pedestal" {...scrollReveal(0.1)}>
            <div className="zc-pedestal-frame">
              <GuestPagePreview />
            </div>
          </motion.div>
          <div>
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.eventpage.eyebrow}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              EINE EIGENE <span className="zc-accent-word">seite</span> FÜR EUER EVENT
            </motion.h2>
            <motion.p className="zc-sub" {...scrollReveal(0.16)}>
              {t.eventpage.desc}
            </motion.p>
            <motion.div className="zc-points" {...scrollReveal(0.22)}>
              {t.eventpage.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </ChapterShell>

      {/* Kapitel 07 — Teilen & Drucken */}
      <ChapterShell num={7} label={t.share.eyebrow} id="kapitel-07" nextId="kapitel-08">
        <div className="zc-body">
          <div>
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.share.eyebrow}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              VOM SCAN <span className="zc-accent-word">zum tisch</span>
            </motion.h2>
            <motion.p className="zc-sub" {...scrollReveal(0.16)}>
              {t.share.desc}
            </motion.p>
            <motion.div className="zc-points" {...scrollReveal(0.22)}>
              {t.share.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div className="zc-pedestal" {...scrollReveal(0.1)}>
            <div className="zc-pedestal-frame">
              <SharePreview />
            </div>
          </motion.div>
        </div>
      </ChapterShell>

      {/* Kapitel 08 — Preise + Vertrauen (letztes Kapitel, kein "Weiter") */}
      <ChapterShell num={8} label={t.pricing.eyebrow} id="kapitel-08">
        <div className="zc-full">
          <div className="zc-centered-head">
            <motion.span className="zc-eyebrow" {...scrollReveal(0)}>
              {t.pricing.eyebrow}
            </motion.span>
            <motion.h2 className="zc-heading" {...scrollReveal(0.08)}>
              {t.pricing.heading.toUpperCase()}
            </motion.h2>
            <motion.div {...scrollReveal(0.16)}>
              <Link href="/preise/vergleich" className="zc-btn zc-btn-primary" style={{ marginTop: 16, display: "inline-block" }}>
                Preise ansehen
              </Link>
            </motion.div>
          </div>
          <motion.div className="zc-trust-row" {...scrollReveal(0.24)}>
            {t.trust.items.map((item) => (
              <div className="zc-trust-item" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </ChapterShell>

      {/* Abschliessender Footer-Streifen — kein Kapitel, siehe docs/MOTION.md §2 */}
      <footer className="zc-footer">
        <p className="zc-footer-tagline">{t.footer.tagline}</p>
        <nav className="zc-footer-links">
          <Link href="/kontakt">Kontakt</Link>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
        </nav>
      </footer>
    </div>
  );
}
