import { prisma } from "@/lib/prisma";
import { RevealAnimator } from "@/components/marketing/RevealAnimator";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { GuestPagePreview, SharePreview, GalleryPreview } from "@/components/marketing/PhoneMockups";
import { HeroStory } from "@/components/marketing/HeroStory";
import { TemplateGallery } from "@/components/marketing/TemplateGallery";
import { categorySlug, categoryLabel } from "@/lib/gallery-templates";
import { getGalleryCategories } from "@/lib/gallery-templates-data";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { getLocale } from "@/lib/i18n";
import { homepageCopy } from "@/lib/translations/homepage";

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

      <nav>
        <Logo />
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

      <section className="hero reveal">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">{t.hero.eyebrow}</div>
            <h1>{t.hero.title}</h1>
            <p className="hero-sub">{t.hero.sub}</p>
            <div className="hero-cta">
              <a href="#preise" className="btn btn-primary">
                {t.hero.ctaPrimary}
              </a>
              <a href="#vorlagen" className="btn btn-ghost">
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-frame">
              <div className="phone-inner">
                <GalleryPreview />
              </div>
            </div>
            <span className="hero-chip" style={{ top: 28, left: -6 }}>
              {t.hero.chipBilingual}
            </span>
            <span className="hero-chip" style={{ top: "48%", right: -22 }}>
              {t.hero.chipAi}
            </span>
            <span className="hero-chip" style={{ bottom: 44, left: 0 }}>
              🎨 {templateCount} {t.nav.templates}
            </span>
          </div>
        </div>
      </section>

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
              <a
                key={category}
                href={`#cat-${categorySlug(category)}`}
                className="cat-nav-tile"
                style={tileBg}
              >
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
