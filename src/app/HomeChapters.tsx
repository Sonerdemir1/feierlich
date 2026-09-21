"use client";

// Startseiten-Kapitel im "editorialen Erlebniswelt"-Stil (docs/MOTION.md).
// Fuenf Bewegungstechniken, bewusst abwechselnd ueber die Kapitel verteilt
// statt eines Einzelmusters: scroll-gekoppelte Kamerafahrt (scale/opacity),
// Pinning (Kapitel 05, CSS position:sticky + useScroll/useTransform),
// Text-Fuell-Uebergaenge, Wort-Stagger-Ueberschriften und horizontaler
// Einschub (x ±20%→0%). Alles mit Motion umgesetzt, kein GSAP. Kapitel 04
// (Vorlagen) bewusst OHNE jeden Motion-Wrapper (docs/MOTION.md §3) —
// eigene Kartenoptik/-animation in TemplateGallery bleibt unangetastet.
import { useRef, useSyncExternalStore } from "react";
import type { ReactNode, RefObject } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { GalleryPreview, GuestPagePreview, SharePreview } from "@/components/marketing/PhoneMockups";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { TemplateGallery, type GalleryCategory } from "@/components/marketing/TemplateGallery";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { homepageCopy } from "@/lib/translations/homepage";
import type { Locale } from "@/lib/i18n";
import "@/components/marketing/zera/zera.css";
import "@/components/marketing/zera/dixor-motion.css";

const TOTAL_CHAPTERS = 8;
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function Check({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Liefert false beim SSR/ersten Client-Rendering (identisch, kein Hydration-
// Mismatch), erst danach true — gleiches Muster wie CameraSection.tsx
// (invitation-sections), siehe dortiger Kommentar.
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// Technik 1: Kamerafahrt — scale 1.08→1 + opacity 0→1, kontinuierlich an
// den Scroll-Fortschritt gekoppelt. Siehe docs/MOTION.md §2.
// prefers-reduced-motion (MOTION.md §5, verbindlich) — gefundene, dort
// dokumentierte Luecke jetzt geschlossen: gleiche Technik wie
// CameraSection.tsx (invitation-sections) — Wertebereich kollabiert auf
// [1,1] statt die style-Prop-Form zu wechseln (vermeidet einen bereits
// gefundenen Motion-Aufraeum-Bug beim Prop-Typwechsel, siehe dortiger
// Kommentar), erst nach dem Mount aktiv (kein Hydration-Mismatch).
function useCameraProgress() {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();
  const skipMotion = mounted && prefersReducedMotion;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], skipMotion ? [1, 1] : [1.08, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], skipMotion ? [1, 1] : [0, 1]);
  return { ref, scale, opacity };
}

function CameraChapterShell({
  num,
  label,
  id,
  nextHref,
  nextLabel = "Weiter",
  scale,
  opacity,
  refCallback,
  children,
}: {
  num: number;
  label: string;
  id: string;
  nextHref?: string;
  nextLabel?: string;
  scale?: MotionValue<number>;
  opacity?: MotionValue<number>;
  refCallback?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  return (
    <motion.section
      ref={refCallback}
      className="zc-chapter"
      id={id}
      style={scale && opacity ? { scale, opacity } : undefined}
    >
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
        {nextHref ? (
          <Link href={nextHref} className="zc-next">
            {nextLabel}
            <span className="zc-next-arrow" aria-hidden="true">
              ↓
            </span>
          </Link>
        ) : (
          <span className="zc-next" style={{ opacity: 0.35, cursor: "default" }}>
            Ende der Vorschau
          </span>
        )}
      </div>
    </motion.section>
  );
}

// Technik 2 (neu, aus Dixor TextAnimationV1/useScrollAnimation): Text-
// Fuell-Effekt — background-clip:text + Gradient, background-size
// kontinuierlich von 0% auf 100% an den Scroll-Fortschritt der
// Uebergangsstrecke gekoppelt (kein Scale/Opacity, reiner "Lesefortschritt"-
// Texteinfaerbe-Effekt). Eingesetzt als Zwischentext zwischen Hauptkapiteln,
// kein eigenes nummeriertes Kapitel.
function TextFillTransition({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // prefers-reduced-motion (MOTION.md §5) — gleiche Technik wie useCameraProgress
  // oben: Wertebereich kollabiert auf eine Konstante statt die style-Prop-Form
  // zu wechseln, erst nach dem Mount aktiv (kein Hydration-Mismatch).
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();
  const skipMotion = mounted && prefersReducedMotion;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.3"] });
  const backgroundSize = useTransform(scrollYProgress, [0, 1], skipMotion ? ["100% 100%", "100% 100%"] : ["0% 100%", "100% 100%"]);
  return (
    <div className="zdx-textfill-band" ref={ref}>
      <motion.p className="zdx-textfill-text" style={{ backgroundSize }}>
        {text}
      </motion.p>
    </div>
  );
}

// Technik 3 (neu, aus Dixor SplitAnimation): Wort-Stagger-Reveal —
// einmalig durch Sichtbarkeit ausgeloest (whileInView, viewport once),
// aber wortweise gestaffelt statt des kompletten Blocks auf einmal
// (staggerChildren statt Block-Fade). Jedes Wort einzeln in einem
// overflow:hidden-Span, das Wort selbst gleitet von y:110% auf y:0%.
type StaggerWord = string | { text: string; accent?: boolean };
function normalizeWord(w: StaggerWord): { text: string; accent?: boolean } {
  return typeof w === "string" ? { text: w } : w;
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const staggerWordVariant = {
  hidden: { y: "110%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const } },
};

function StaggerHeading({
  as: Tag = "h2",
  className,
  lines,
}: {
  as?: "h1" | "h2";
  className?: string;
  lines: StaggerWord[][];
}) {
  // prefers-reduced-motion (MOTION.md §5) — anders als bei der Kamerafahrt
  // keine MotionValues hier, nur Variants-Objekte (whileInView-Ausloesung):
  // hidden/visible einfach auf denselben Endzustand setzen statt echte
  // Bewegung, keine Gefahr des bei CameraSection gefundenen Aufraeum-Bugs
  // (der betraf nur den Wechsel der style-Prop-FORM zwischen MotionValue und
  // normalem Objekt, nicht den Austausch zweier gleich geformter Variants).
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();
  const skipMotion = mounted && prefersReducedMotion;
  const containerVariants = skipMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : staggerContainer;
  const wordVariants = skipMotion ? { hidden: { y: "0%", opacity: 1 }, visible: { y: "0%", opacity: 1 } } : staggerWordVariant;
  return (
    <Tag className={className}>
      <motion.span
        style={{ display: "inline" }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
        variants={containerVariants}
      >
        {lines.map((line, li) => (
          <span key={li} style={{ display: "block" }}>
            {line.map(normalizeWord).map((word, wi) => (
              <span className="zdx-stagger-word" key={`${li}-${wi}`}>
                <motion.span variants={wordVariants} className={word.accent ? "zc-accent-word" : undefined}>
                  {word.text}
                  {wi < line.length - 1 ? " " : ""}
                </motion.span>
              </span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

// Technik 5 (neu, aus Dixor useLeftRightAnimation/useHorizontalScroll) —
// horizontaler Einschub: einmalig durch Sichtbarkeit ausgeloest
// (whileInView, wie Technik 3), aber x- statt y-Achse — x ±20%→0% +
// Opacity. Dixor nutzt dafuer GSAP "xPercent" (transformiert bei GSAP
// relativ zur Elementbreite) — Motion kennt "xPercent" nicht als
// Transform-Kurzform (es wird sonst stillschweigend als bedeutungslose
// CSS-Eigenschaft geschrieben, keine sichtbare Bewegung); das Motion-
// Aequivalent ist "x" mit Prozent-String, exakt wie bereits beim
// Pin-Effekt (contentX) verwendet. Dixor nutzt diese Technik nur
// linksseitig (Portfolio-Vorschaubilder); hier zusaetzlich rechtsseitig
// gespiegelt, damit sich die Bewegungsrichtung ueber die Kapitel
// abwechselt statt sich zu wiederholen (Auftrag: "Erlebnisreise" statt
// Einzelmuster). Betrifft nur das jeweilige Bild-/Block-Element, nicht
// die ganze Sektion — die grosse Panel-Scroll-Hijack-Sektion
// (useHorizontalScroll) wurde bewusst NICHT uebernommen, da sie fremden
// Inhalt braeuchte und unsere 8-Kapitel-Struktur sprengen wuerde.
const slideInVariants = {
  left: {
    hidden: { x: "-20%", opacity: 0 },
    visible: { x: "0%", opacity: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const } },
  },
  right: {
    hidden: { x: "20%", opacity: 0 },
    visible: { x: "0%", opacity: 1, transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] as const } },
  },
};

function SlideInHorizontal({
  from,
  className,
  children,
}: {
  from: "left" | "right";
  className?: string;
  children: ReactNode;
}) {
  // prefers-reduced-motion (MOTION.md §5) — gleiches Prinzip wie StaggerHeading.
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();
  const skipMotion = mounted && prefersReducedMotion;
  const variants = skipMotion ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : slideInVariants[from];
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

// Technik 4 (neu, aus Dixor ZoomVideoV1) — Pinning: CSS position:sticky
// (statt GSAP pin:true) haelt den Inhalt fest, waehrend eine hohe
// Laufstrecke (zdx-pin-wrapper, ~220vh) im Hintergrund durchscrollt.
// useScroll auf den Wrapper (offset ["start start","end end"]) liefert
// den Fortschritt durch die Pin-Phase, treibt Skalierung/Einblenden des
// Medien-Elements — die "fehlende Kamerafahrt-Wirkung" aus Phase B.
function usePinProgress() {
  const ref = useRef<HTMLDivElement>(null);
  // prefers-reduced-motion (MOTION.md §5) — gleiche Technik wie useCameraProgress.
  // Das position:sticky-Halten selbst (siehe Aufrufstelle) ist reines CSS-Layout,
  // keine Bewegungssequenz — bleibt unangetastet, nur die Motion-Transforms
  // kollabieren auf ihren Endzustand.
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();
  const skipMotion = mounted && prefersReducedMotion;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const mediaScale = useTransform(scrollYProgress, [0, 1], skipMotion ? [1, 1] : [0.6, 1]);
  const contentX = useTransform(scrollYProgress, [0, 0.6], skipMotion ? ["0%", "0%"] : ["-40%", "0%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.35], skipMotion ? [1, 1] : [0, 1]);
  return { ref, mediaScale, contentX, contentOpacity };
}

export type HomePackage = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  slug: string;
  highlight: boolean;
  features: string[];
};

export function HomeChapters({
  categories,
  paket,
  packages,
  photoVideoAddOn,
  locale,
}: {
  categories: GalleryCategory[];
  paket?: string;
  packages: HomePackage[];
  photoVideoAddOn: { name: string; priceCents: number } | null;
  locale: Locale;
}) {
  const t = homepageCopy[locale];
  const ch2 = useCameraProgress();
  const ch3 = useCameraProgress();
  const ch6 = useCameraProgress();
  const ch7 = useCameraProgress();
  const ch8 = useCameraProgress();
  const { ref: pin5Ref, mediaScale: pin5MediaScale, contentX: pin5ContentX, contentOpacity: pin5ContentOpacity } = usePinProgress();

  return (
    <div className="zc-page">
      {/* Oberste Nav-Leiste — beim Umbau auf den Kapitel-Stil versehentlich
          ersatzlos gestrichen (Nutzer-Regression), hier mit den aktuellen
          --zc-*-Tokens wiederhergestellt. Statisch, nicht sticky/fixed. */}
      <header className="zc-nav">
        <Link href="/" className="zc-nav-logo">
          einladi
        </Link>
        <nav className="zc-nav-links">
          <a href="#kapitel-02">{t.nav.gallery}</a>
          <a href="#vorlagen">{t.nav.templates}</a>
          <a href="#preise">{t.nav.pricing}</a>
          <Link href="/dashboard">{t.nav.login}</Link>
        </nav>
        <div className="zc-nav-right">
          <LanguageSwitcher locale={locale} redirectTo="/" />
          <Link href="/dashboard" className="zc-btn zc-btn-primary">
            {t.nav.cta}
          </Link>
        </div>
      </header>

      {/* Kapitel 01 — Hero. Beim Laden bereits sichtbar, unanimiert. */}
      <CameraChapterShell num={1} label="Willkommen" id="kapitel-01" nextHref="#kapitel-02">
        <div className="zc-body">
          <div>
            <span className="zc-eyebrow">{t.hero.eyebrow}</span>
            <h1 className="zc-heading">
              EURE <span className="zc-accent-word">erinnerungen</span>.
              <br />
              NICHT VERSTREUT AUF FREMDEN HANDYS.
            </h1>
            <p className="zc-sub">{t.hero.sub}</p>
            <div className="zc-cta-row">
              <a href="#preise" className="zc-btn zc-btn-primary">
                {t.hero.ctaPrimary}
              </a>
              <a href="#vorlagen" className="zc-btn zc-btn-ghost">
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>
          <div className="zc-pedestal">
            <div className="zc-pedestal-photo" style={{ backgroundImage: "url(/images/templates/wedding-toast-elegant.jpg)" }} />
          </div>
        </div>
      </CameraChapterShell>

      {/* Kapitel 02 — Fotos, Videos & Gästebuch. Kamerafahrt + Wort-Stagger-
          Ueberschrift. */}
      <CameraChapterShell num={2} label={t.erinnerungen.eyebrow} id="kapitel-02" nextHref="#kapitel-03" scale={ch2.scale} opacity={ch2.opacity} refCallback={ch2.ref}>
        <div className="zc-body zc-body--reverse">
          <SlideInHorizontal from="right" className="zc-pedestal">
            <div className="zc-pedestal-frame">
              <GalleryPreview />
            </div>
          </SlideInHorizontal>
          <div>
            <span className="zc-eyebrow">{t.erinnerungen.eyebrow}</span>
            <StaggerHeading
              className="zc-heading"
              lines={[
                ["ALLES,", "WAS", "EURE", "GÄSTE"],
                [{ text: "festhalten", accent: true }, "—", "AN", "EINEM", "ORT"],
              ]}
            />
            <p className="zc-sub">{t.erinnerungen.desc}</p>
            <div className="zc-points">
              {t.erinnerungen.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CameraChapterShell>

      {/* Kapitel 03 — So funktioniert's. Kamerafahrt + Wort-Stagger-
          Ueberschrift. */}
      <CameraChapterShell num={3} label={t.how.eyebrow} id="kapitel-03" nextHref="#vorlagen" scale={ch3.scale} opacity={ch3.opacity} refCallback={ch3.ref}>
        <div className="zc-full">
          <div className="zc-centered-head">
            <span className="zc-eyebrow">{t.how.eyebrow}</span>
            <StaggerHeading className="zc-heading" lines={[t.how.heading.toUpperCase().split(" ")]} />
          </div>
          <div className="zc-steps">
            {t.how.steps.map((step, i) => (
              <div key={step.title}>
                <span className="zc-step-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="zc-step-title">{step.title}</div>
                <div className="zc-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </CameraChapterShell>

      {/* Text-Fuell-Uebergang vor dem Vorlagen-Kapitel — kein eigenes
          nummeriertes Kapitel. */}
      <TextFillTransition text="Wählt eine Vorlage, die zu euch passt." />

      {/* Kapitel 04 — Vorlagen. BEWUSST OHNE jeden Motion-Wrapper
          (docs/MOTION.md §3: eigene Kartenoptik/-animation, bleibt
          unveraendert) — plain <section>, keine motion.section. */}
      <section className="zc-chapter" id="vorlagen">
        <div className="zc-chapter-head">
          <span className="zc-chapter-num">(04)</span>
          <span className="zc-chapter-label">— {t.nav.templates}</span>
        </div>
        <div className="zc-full">
          <div className="zc-centered-head">
            <span className="zc-eyebrow">{t.nav.templates}</span>
            <h2 className="zc-heading">{t.vorlagen.heading.toUpperCase()}</h2>
            <p className="zc-sub" style={{ margin: "0 auto" }}>
              {t.vorlagen.desc}
            </p>
          </div>
          <TemplateGallery categories={categories} locale="de" paket={paket} />
        </div>
        <div className="zc-footer-bar">
          <div className="zc-pagination">
            <span>04 / {String(TOTAL_CHAPTERS).padStart(2, "0")}</span>
            <span className="zc-pagination-track" style={{ ["--zc-progress" as string]: `${(4 / TOTAL_CHAPTERS) * 100}%` }} />
          </div>
          <Link href="#kapitel-05" className="zc-next">
            Weiter
            <span className="zc-next-arrow" aria-hidden="true">
              ↓
            </span>
          </Link>
        </div>
      </section>

      {/* Kapitel 05 — Editor. HAUPTTECHNIK: Pinning (aus Dixor ZoomVideoV1),
          nachgebaut mit CSS position:sticky + Motion useScroll/useTransform
          statt GSAP pin:true. Kein Kamerafahrt-Wrapper hier, keine Wort-
          Stagger-Ueberschrift (bewusst, siehe Auftrag). */}
      <div className="zdx-pin-wrapper" id="kapitel-05" ref={pin5Ref}>
        <div className="zdx-pin-sticky">
          <div className="zc-chapter-head">
            <span className="zc-chapter-num">(05)</span>
            <span className="zc-chapter-label">— {t.editor.eyebrow}</span>
          </div>

          <div className="zdx-pin-body">
            <motion.div style={{ x: pin5ContentX, opacity: pin5ContentOpacity }}>
              <span className="zc-eyebrow">{t.editor.eyebrow}</span>
              <h2 className="zc-heading">
                GESTALTEN <span className="zc-accent-word">in echtzeit</span>
              </h2>
              <p className="zc-sub">{t.editor.desc}</p>
              <div className="zc-points">
                {t.editor.points.map((point) => (
                  <div className="zc-point" key={point}>
                    <span className="zc-point-mark" aria-hidden="true" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="zc-pedestal">
              <motion.div className="zc-pedestal-frame zdx-pin-media" style={{ scale: pin5MediaScale }}>
                <EditorPreview />
              </motion.div>
            </div>
          </div>

          <div className="zc-footer-bar">
            <div className="zc-pagination">
              <span>05 / {String(TOTAL_CHAPTERS).padStart(2, "0")}</span>
              <span className="zc-pagination-track" style={{ ["--zc-progress" as string]: `${(5 / TOTAL_CHAPTERS) * 100}%` }} />
            </div>
            <Link href="#kapitel-06" className="zc-next">
              Weiter
              <span className="zc-next-arrow" aria-hidden="true">
                ↓
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Kapitel 06 — Event-Webseite. Kamerafahrt + Wort-Stagger-
          Ueberschrift. */}
      <CameraChapterShell num={6} label={t.eventpage.eyebrow} id="kapitel-06" nextHref="#kapitel-07" scale={ch6.scale} opacity={ch6.opacity} refCallback={ch6.ref}>
        <div className="zc-body zc-body--reverse">
          <SlideInHorizontal from="left" className="zc-pedestal">
            <div className="zc-pedestal-frame">
              <GuestPagePreview />
            </div>
          </SlideInHorizontal>
          <div>
            <span className="zc-eyebrow">{t.eventpage.eyebrow}</span>
            <StaggerHeading
              className="zc-heading"
              lines={[["EINE", "EIGENE", { text: "seite", accent: true }, "FÜR", "EUER", "EVENT"]]}
            />
            <p className="zc-sub">{t.eventpage.desc}</p>
            <div className="zc-points">
              {t.eventpage.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CameraChapterShell>

      {/* Kapitel 07 — Teilen & Drucken. Kamerafahrt, Ueberschrift bewusst
          OHNE Wort-Stagger (Rhythmus — nicht jedes Kapitel bekommt jede
          Politur). */}
      <CameraChapterShell num={7} label={t.share.eyebrow} id="kapitel-07" nextHref="#preise" scale={ch7.scale} opacity={ch7.opacity} refCallback={ch7.ref}>
        <div className="zc-body">
          <div>
            <span className="zc-eyebrow">{t.share.eyebrow}</span>
            <h2 className="zc-heading">
              VOM SCAN <span className="zc-accent-word">zum tisch</span>
            </h2>
            <p className="zc-sub">{t.share.desc}</p>
            <SlideInHorizontal from="right" className="zc-points">
              {t.share.points.map((point) => (
                <div className="zc-point" key={point}>
                  <span className="zc-point-mark" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </SlideInHorizontal>
          </div>
          <div className="zc-pedestal">
            <div className="zc-pedestal-frame">
              <SharePreview />
            </div>
          </div>
        </div>
      </CameraChapterShell>

      {/* Text-Fuell-Uebergang vor dem Preise-Kapitel. */}
      <TextFillTransition text="Alles startet mit dem passenden Paket." />

      {/* Kapitel 08 — Preise (echte Live-Pakete + optionales
          Foto-Video-Zusatzpaket), letztes Kapitel, kein "Weiter". */}
      <CameraChapterShell num={8} label={t.pricing.eyebrow} id="preise" scale={ch8.scale} opacity={ch8.opacity} refCallback={ch8.ref}>
        <div className="zc-full">
          <div className="zc-centered-head">
            <span className="zc-eyebrow">{t.pricing.eyebrow}</span>
            <h2 className="zc-heading">{t.pricing.heading.toUpperCase()}</h2>
          </div>

          {photoVideoAddOn && (
            <div className="zc-pricing-addon">
              <div className="zc-pricing-card zc-pricing-card--highlight">
                <div className="zc-compare-badge">{t.pricing.addOnBadge}</div>
                <div className="zc-pricing-name" style={{ marginTop: 6 }}>
                  {photoVideoAddOn.name}
                </div>
                <div className="zc-pricing-tag">{t.pricing.addOnTag}</div>
                <div className="zc-pricing-amount">{eur.format(photoVideoAddOn.priceCents / 100)}</div>
                <div className="zc-pricing-features">
                  {t.pricing.addOnFeatures.map((feature) => (
                    <div className="zc-pricing-feature" key={feature}>
                      <span className="zc-pricing-feature-check" aria-hidden="true">
                        <Check />
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="zc-centered-head" style={{ marginTop: photoVideoAddOn ? 8 : 0 }}>
            <span className="zc-eyebrow">{t.pricing.eyebrow2}</span>
            <h3 className="zc-heading" style={{ fontSize: "clamp(20px, 2.4vw, 28px)", marginBottom: 12 }}>
              {t.pricing.heading2}
            </h3>
            <Link href="/preise/vergleich" style={{ fontFamily: "var(--font-karla), system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: "var(--zc-accent)" }}>
              Alle Pakete im Vergleich →
            </Link>
          </div>

          <div className="zc-pricing-grid">
            {packages.map((pkg) => (
              <div className={`zc-pricing-card${pkg.highlight ? " zc-pricing-card--highlight" : ""}`} key={pkg.id}>
                {pkg.highlight && <div className="zc-compare-badge">{t.pricing.popularBadge}</div>}
                <div className="zc-pricing-name" style={pkg.highlight ? { marginTop: 6 } : undefined}>
                  {pkg.name}
                </div>
                {pkg.description && <div className="zc-pricing-tag">{pkg.description}</div>}
                <div className="zc-pricing-amount">{eur.format(pkg.priceCents / 100)}</div>
                <div className="zc-pricing-features">
                  {pkg.features.map((name) => (
                    <div className="zc-pricing-feature" key={name}>
                      <span className="zc-pricing-feature-check" aria-hidden="true">
                        <Check />
                      </span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
                <Link href={`/?paket=${pkg.slug}#vorlagen`} className="zc-btn zc-btn-primary" style={{ width: "100%", justifyContent: "center", textAlign: "center" }}>
                  Dieses Paket wählen
                </Link>
                <Link href={`/preise/${pkg.slug}`} className="zc-pricing-details">
                  Alle Funktionen ansehen →
                </Link>
              </div>
            ))}
          </div>

          <div className="zc-trust-row">
            {t.trust.items.map((item) => (
              <div className="zc-trust-item" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </CameraChapterShell>

      {/* Abschliessender Footer-Streifen — kein Kapitel. CC-BY-Nachweise
          fuer die in TemplateGallery (unveraendert) weiterverwendeten
          Fotos — unabhaengig vom Envato-Elements-Hero-Foto oben, das
          volle kommerzielle Lizenz ohne Namensnennung hat. */}
      <footer className="zc-footer">
        <div>
          <p className="zc-footer-tagline">{t.footer.tagline}</p>
          <p className="zc-footer-credits">
            Foto-Nachweise: Farn-Nahaufnahme © Cyron Ray Macey (CC BY 2.0) · Luftballons © D. Sharon Pruitt (CC BY 2.0) · Lounge © Basile Morin (CC
            BY-SA 4.0), via Wikimedia Commons.
          </p>
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
