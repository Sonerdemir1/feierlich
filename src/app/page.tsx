import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { RevealAnimator } from "@/components/marketing/RevealAnimator";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { GuestPagePreview, SharePreview, GalleryPreview } from "@/components/marketing/PhoneMockups";
import { HeroStory } from "@/components/marketing/HeroStory";
import { MotionHero } from "@/components/marketing/MotionHero";
import { TemplateGallery } from "@/components/marketing/TemplateGallery";
import { categorySlug, categoryLabel } from "@/lib/gallery-templates";
import { getGalleryCategories } from "@/lib/gallery-templates-data";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { getLocale } from "@/lib/i18n";
import { homepageCopy } from "@/lib/translations/homepage";
import { packageSlug } from "@/lib/packages";

// Ohne dies versucht `next build`, diese Seite bei jedem Deploy statisch
// vorzurendern und braucht dafuer eine live erreichbare Datenbank zur
// Build-Zeit — auf Railway (Build-Schritt vor dem Start des
// Postgres-Containers) schlaegt das sonst fehl.
export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const TRUST_ICONS: Record<string, ReactNode> = {
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" strokeOpacity="0.35" />
      <circle cx="12" cy="6.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.2" cy="8.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.7" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.2" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7.8" cy="15.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="6.3" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7.8" cy="8.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  receipt: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-1-1.5-1 1.5-2.5-1.5L6 21V3z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" strokeLinecap="round" />
    </svg>
  ),
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <a href="#" className="logo">
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" stroke={dark ? "var(--gold)" : "var(--terracotta)"} strokeWidth="1.4">
        <rect x="1" y="1" width="26" height="20" rx="1.5" />
        <path d="M1.5 2l12 9.5 12-9.5" />
      </svg>
      <span style={dark ? { color: "var(--ivory)" } : undefined}>einladi</span>
    </a>
  );
}

export default async function Home() {
  const [locale, galleryCategories, packages, modules, photoVideoAddOn] = await Promise.all([
    getLocale(),
    getGalleryCategories(),
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany(),
    prisma.addOn.findUnique({ where: { key: "photo-video-collection" } }),
  ]);
  const t = homepageCopy[locale];

  const moduleNameByKey = new Map(modules.map((m) => [m.key, m.name]));
  const templateCount = galleryCategories.reduce((n, c) => n + c.items.length, 0);

  return (
    <>
      <RevealAnimator />

      {/* docs/MOTION.md §2 — der Umschlag-Moment ersetzt den bisherigen
          Text+Mockup-Hero. Bewusst nur um die Hero-Szene herum
          .motion-home-gescoped (nicht die ganze Seite), damit die
          Sections darunter (noch cremefarben) nicht unlesbar werden —
          die volle "Tinte & Kerzenlicht"-Uebertragung auf den Rest der
          Seite ist ein eigener, noch offener Schritt (siehe Ankündigung
          im Chat). Die Nav schwebt hier transparent ueber der Szene
          (position:fixed) statt Platz wegzunehmen — sonst ragt die
          100dvh-Hero-Sektion unten ueber den sichtbaren Viewport hinaus. */}
      <div className="motion-home">
        <div className="motion-grain" />
        <div className="motion-vignette" />
        <nav className="motion-nav">
          <Logo dark />
          <div className="nav-links">
            <a href="#erinnerungen">{t.nav.gallery}</a>
            <a href="#vorlagen">{t.nav.templates}</a>
            <a href="#preise">{t.nav.pricing}</a>
            <a href="/dashboard">{t.nav.login}</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LanguageSwitcher locale={locale} redirectTo="/" />
            <a href="/dashboard" className="btn btn-primary">
              {t.nav.cta}
            </a>
          </div>
        </nav>
        <MotionHero names="Anna & Lukas" />
        <div className="motion-hero-copy">
          <div className="eyebrow" style={{ color: "var(--gold)" }}>
            {t.hero.eyebrow}
          </div>
          <h1 style={{ color: "var(--parchment)" }}>{t.hero.title}</h1>
          <p className="hero-sub" style={{ color: "color-mix(in srgb, var(--parchment) 78%, transparent)" }}>
            {t.hero.sub}
          </p>
          <div className="hero-cta">
            <a href="#preise" className="btn btn-primary">
              {t.hero.ctaPrimary}
            </a>
            <a href="#vorlagen" className="btn btn-ghost motion-btn-ghost">
              {t.hero.ctaSecondary}
            </a>
          </div>
        </div>
      </div>

      <section className="cat-nav reveal">
        <div className="cat-nav-heading">{t.catNav.heading}</div>
        <div className="cat-nav-grid">
          {galleryCategories.map(({ category, items }) => {
            const photo = items.find((i) => i.photoBackground)?.photoBackground;
            // Düğün hat keine ambient-getönten Fotos (PHOTO_BACKGROUND) mehr,
            // sondern echte Kartendesigns (cardImageUrl) — die Karte selbst
            // eignet sich als Kachel-Hintergrund genauso gut.
            const cardImage = items.find((i) => i.cardImageUrl)?.cardImageUrl;
            // Kına Gecesi/Nişan/Sünnet teilen sich dasselbe Iznik-Fliesenfoto
            // (nur per `tint` unterschieden) — ohne den Farbwasch hier sehen
            // alle drei Kacheln identisch aus. Der Wasch macht sie auf einen
            // Blick unterscheidbar, wie auf der echten Kartenvorschau auch.
            const tileBg = photo
              ? { backgroundImage: `linear-gradient(rgba(${photo.tint},0.45), rgba(${photo.tint},0.45)), url(${photo.src})` }
              : cardImage
                ? { backgroundImage: `url(${cardImage})` }
                : { background: "var(--ivory-2)" };
            return (
              <a key={category} href={`#cat-${categorySlug(category)}`} className="cat-nav-tile">
                <span className="cat-nav-bg" style={tileBg} />
                <span>{categoryLabel(category, locale)}</span>
              </a>
            );
          })}
        </div>
      </section>

      <HeroStory />

      <section className="stats reveal">
        <div className="stats-grid">
          {t.stats.map((s, i) => (
            <div className="stats-item" key={i}>
              <div className="stats-num">{i === 0 ? templateCount : s.num}</div>
              <div className="stats-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="how reveal" id="wie">
        <div className="how-head">
          <div className="eyebrow">{t.how.eyebrow}</div>
          <h2>{t.how.heading}</h2>
        </div>
        <div className="how-grid">
          {t.how.steps.map((step, i) => (
            <div key={i}>
              <div className="how-num">{String(i + 1).padStart(2, "0")}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="feature reveal" id="erinnerungen">
        <div className="feature-copy">
          <div className="eyebrow">{t.erinnerungen.eyebrow}</div>
          <h2>{t.erinnerungen.heading}</h2>
          <p className="feature-desc">{t.erinnerungen.desc}</p>
          <div className="feature-points">
            {t.erinnerungen.points.map((point, i) => (
              <div key={i}>
                <Check />
                {point}
              </div>
            ))}
          </div>
        </div>
        <div className="frame-wrap">
          <div className="phone-frame">
            <div className="phone-inner">
              <GalleryPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="templates reveal" id="vorlagen">
        <div className="templates-head">
          <div className="eyebrow">{templateCount} {t.nav.templates}</div>
          <h2>{t.vorlagen.heading}</h2>
          <p>{t.vorlagen.desc}</p>
        </div>

        <TemplateGallery categories={galleryCategories} locale={locale} />
      </section>

      <section className="feature reveal" id="editor">
        <div className="feature-copy">
          <div className="eyebrow">{t.editor.eyebrow}</div>
          <h2>{t.editor.heading}</h2>
          <p className="feature-desc">{t.editor.desc}</p>
          <div className="feature-points">
            {t.editor.points.map((point, i) => (
              <div key={i}>
                <Check />
                {point}
              </div>
            ))}
          </div>
        </div>
        <div className="frame-wrap">
          <div className="phone-frame">
            <div className="phone-inner">
              <EditorPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="feature reveal">
        <div className="feature-copy">
          <div className="eyebrow">{t.eventpage.eyebrow}</div>
          <h2>{t.eventpage.heading}</h2>
          <p className="feature-desc">{t.eventpage.desc}</p>
          <div className="feature-points">
            {t.eventpage.points.map((point, i) => (
              <div key={i}>
                <Check />
                {point}
              </div>
            ))}
          </div>
        </div>
        <div className="frame-wrap">
          <div className="phone-frame">
            <div className="phone-inner">
              <GuestPagePreview />
            </div>
          </div>
        </div>
      </section>

      <section className="feature reveal">
        <div className="feature-copy">
          <div className="eyebrow">{t.share.eyebrow}</div>
          <h2>{t.share.heading}</h2>
          <p className="feature-desc">{t.share.desc}</p>
          <div className="feature-points">
            {t.share.points.map((point, i) => (
              <div key={i}>
                <Check />
                {point}
              </div>
            ))}
          </div>
        </div>
        <div className="frame-wrap">
          <div className="phone-frame">
            <div className="phone-inner">
              <SharePreview />
            </div>
          </div>
        </div>
      </section>

      <section className="trust-bar reveal">
        {t.trust.items.map((item, i) => (
          <div className="trust-item" key={i}>
            <span className="trust-item-icon">{TRUST_ICONS[item.icon]}</span>
            <div>
              <div className="trust-item-label">{item.label}</div>
              <div className="trust-item-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="pricing reveal" id="preise">
        <div className="pricing-head">
          <div className="eyebrow">{t.pricing.eyebrow}</div>
          <h2>{t.pricing.heading}</h2>
        </div>

        {photoVideoAddOn && (
          <div style={{ maxWidth: 420, margin: "0 auto 44px" }}>
            <div className="price-card highlight">
              <div className="price-badge">{t.pricing.addOnBadge}</div>
              <h3 style={{ marginTop: 6 }}>{photoVideoAddOn.name}</h3>
              <div className="tag">{t.pricing.addOnTag}</div>
              <div className="amount">{eur.format(photoVideoAddOn.priceCents / 100)}</div>
              <ul>
                {t.pricing.addOnFeatures.map((feature, i) => (
                  <li key={i}>
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="pricing-head" style={{ marginTop: 12 }}>
          <div className="eyebrow">{t.pricing.eyebrow2}</div>
          <h2 style={{ fontSize: "clamp(20px, 2.4vw, 26px)" }}>{t.pricing.heading2}</h2>
        </div>
        <div className="price-grid">
          {packages.map((pkg) => {
            const features: string[] = JSON.parse(pkg.features);
            const highlight = pkg.key === "PREMIUM_PLUS";
            return (
              <div className={`price-card${highlight ? " highlight" : ""}`} key={pkg.id}>
                {highlight && <div className="price-badge">{t.pricing.popularBadge}</div>}
                <h3 style={highlight ? { marginTop: 6 } : undefined}>{pkg.name}</h3>
                <div className="tag">{pkg.description}</div>
                <div className="amount">{eur.format(pkg.priceCents / 100)}</div>
                <ul>
                  {features.map((key) => (
                    <li key={key}>
                      <Check />
                      {moduleNameByKey.get(key) ?? key}
                    </li>
                  ))}
                </ul>
                <Link href={`/preise/${packageSlug(pkg.key)}`} className="price-card-details">
                  Alle Funktionen ansehen →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <footer>
        <Logo />
        <p>
          {t.footer.tagline}
          <br />
          info@sonerdemir.de · © 2026 einladi
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12.5 }}>
          <a href="/kontakt" style={{ color: "var(--terracotta-dark)" }}>
            Kontakt
          </a>
          <a href="/impressum" style={{ color: "var(--terracotta-dark)" }}>
            Impressum
          </a>
          <a href="/datenschutz" style={{ color: "var(--terracotta-dark)" }}>
            Datenschutz
          </a>
        </div>
        {/* Pflicht-Namensnennung fuer die 3 neuen Kategorie-Fotos mit
            CC-BY/CC-BY-SA-Lizenz (nicht attributionsfrei wie Pexels) —
            die anderen Fotos auf der Seite sind CC0 und brauchen das nicht. */}
        <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 14 }}>
          Foto-Nachweise: Farn-Nahaufnahme © Cyron Ray Macey (CC BY 2.0) · Luftballons © D. Sharon Pruitt (CC BY 2.0)
          · Lounge © Basile Morin (CC BY-SA 4.0), via Wikimedia Commons.
        </p>
      </footer>
    </>
  );
}
