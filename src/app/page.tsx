import { prisma } from "@/lib/prisma";
import { RevealAnimator } from "@/components/marketing/RevealAnimator";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { GuestPagePreview, SharePreview, GalleryPreview } from "@/components/marketing/PhoneMockups";
import { HeroStory } from "@/components/marketing/HeroStory";
import { TemplateGallery, type GalleryCategory } from "@/components/marketing/TemplateGallery";
import { LanguageSwitcher } from "@/components/marketing/LanguageSwitcher";
import { getLocale } from "@/lib/i18n";
import { homepageCopy } from "@/lib/translations/homepage";

// Ohne dies versucht `next build`, diese Seite bei jedem Deploy statisch
// vorzurendern und braucht dafuer eine live erreichbare Datenbank zur
// Build-Zeit — auf Railway (Build-Schritt vor dem Start des
// Postgres-Containers) schlaegt das sonst fehl.
export const dynamic = "force-dynamic";

const TURKISH_CATEGORIES = new Set(["Düğün", "Kına Gecesi", "Nişan", "Sünnet"]);

function defaultTextForCategory(category: string): string {
  if (TURKISH_CATEGORIES.has(category)) return "Ayşe & Emre";
  if (category === "Verspielt") return "Mia wird 5";
  if (category === "Business Modern") return "Jahresempfang 2026";
  return "Anna & Lukas";
}

// Lizenzfreie Foto-Hintergruende (Pexels-Lizenz, kommerziell nutzbar ohne
// Zuschreibung) je layoutKey. `tint` ist die Vorlagenfarbe als "r,g,b" —
// der dunkle Verlauf ueber dem Foto wird daraus gebaut, damit Bosporus-
// Nachtfoto und Iznik-Fliesenmuster farblich zur jeweiligen Vorlage passen
// statt immer denselben Ton zu haben.
const PHOTO_BACKGROUND: Record<string, { src: string; tint: string }> = {
  "altin-sedef": { src: "/images/templates/bosphorus-night.jpg", tint: "92,15,31" },
  "kina-kirmizi": { src: "/images/templates/iznik-floral.jpg", tint: "122,20,40" },
  "kraliyet-moru": { src: "/images/templates/iznik-floral.jpg", tint: "46,26,71" },
};

function defaultEventLabelForCategory(category: string): string {
  if (category === "Düğün") return "DÜĞÜN DAVETİYESİ";
  if (category === "Kına Gecesi") return "KINA GECESİ";
  if (category === "Nişan") return "NİŞAN DAVETİYESİ";
  if (category === "Sünnet") return "SÜNNET DAVETİYESİ";
  if (category === "Verspielt") return "GEBURTSTAGSPARTY";
  if (category === "Business Modern") return "JAHRESEMPFANG";
  return "HOCHZEITSEINLADUNG";
}

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
  const [locale, templates, packages, modules, photoVideoAddOn] = await Promise.all([
    getLocale(),
    prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany(),
    prisma.addOn.findUnique({ where: { key: "photo-video-collection" } }),
  ]);
  const t = homepageCopy[locale];

  const moduleNameByKey = new Map(modules.map((m) => [m.key, m.name]));

  const templatesByCategory = new Map<string, typeof templates>();
  for (const t of templates) {
    const list = templatesByCategory.get(t.category) ?? [];
    list.push(t);
    templatesByCategory.set(t.category, list);
  }

  const categorySubtitle: Record<string, string> = {
    Zeitlos: "Klar, reduziert, langlebig",
    Botanisch: "Zarte Linien, natürliche Formen",
    Romantisch: "Weich, fließend, persönlich",
    Statement: "Dunkel, klar, selbstbewusst",
    Düğün: "Für den großen Tag – opulent oder elegant",
    "Kına Gecesi": "Für die Henna-Nacht – opulent oder elegant",
    Nişan: "Für die Verlobung – opulent oder elegant",
    Sünnet: "Für das Fest – opulent oder elegant",
    Verspielt: "Fröhlich, bunt, verspielt",
    "Business Modern": "Klar, professionell, zeitgemäß",
  };

  const galleryCategories: GalleryCategory[] = [...templatesByCategory.entries()].map(([category, items]) => ({
    category,
    subtitle: categorySubtitle[category] ?? "",
    items: items.map((t) => ({
      id: t.id,
      name: t.name,
      layoutKey: t.layoutKey,
      priceCents: t.priceCents,
      colors: JSON.parse(t.colors) as { primary: string; accent: string; background: string },
      defaultText: defaultTextForCategory(category),
      defaultEventLabel: defaultEventLabelForCategory(category),
      photoBackground: PHOTO_BACKGROUND[t.layoutKey] ?? null,
    })),
  }));

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
          </div>
        </div>
      </section>

      <HeroStory />

      <section className="stats reveal">
        <div className="stats-grid">
          {t.stats.map((s, i) => (
            <div className="stats-item" key={i}>
              <div className="stats-num">{i === 0 ? templates.length : s.num}</div>
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
          <div className="eyebrow">{templates.length} {t.nav.templates}</div>
          <h2>{t.vorlagen.heading}</h2>
          <p>{t.vorlagen.desc}</p>
        </div>

        <TemplateGallery categories={galleryCategories} />
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
          [KONTAKT E-MAIL] · © 2026 einladi
        </p>
      </footer>
    </>
  );
}
