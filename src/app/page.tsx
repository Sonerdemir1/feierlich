import { prisma } from "@/lib/prisma";
import { RevealAnimator } from "@/components/marketing/RevealAnimator";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { GuestPagePreview, SharePreview, GalleryPreview } from "@/components/marketing/PhoneMockups";
import { HeroStory } from "@/components/marketing/HeroStory";
import { TemplateGallery, type GalleryCategory } from "@/components/marketing/TemplateGallery";

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
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" stroke={dark ? "#B9975B" : "#B2543A"} strokeWidth="1.4">
        <rect x="1" y="1" width="26" height="20" rx="1.5" />
        <path d="M1.5 2l12 9.5 12-9.5" />
      </svg>
      <span style={dark ? { color: "#FAF6EF" } : undefined}>einladi</span>
    </a>
  );
}

export default async function Home() {
  const [templates, packages, modules, photoVideoAddOn] = await Promise.all([
    prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany(),
    prisma.addOn.findUnique({ where: { key: "photo-video-collection" } }),
  ]);

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
          <a href="#erinnerungen">Fotos &amp; Gästebuch</a>
          <a href="#vorlagen">Vorlagen</a>
          <a href="#preise">Preise</a>
          <a href="/dashboard">Anmelden</a>
        </div>
        <a href="/dashboard" className="btn btn-primary">
          Fotos &amp; Videos sammeln
        </a>
      </nav>

      <section className="hero reveal">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Fotos, Videos &amp; Gästebuch — digital gesammelt</div>
            <h1>Eure Erinnerungen. Nicht verstreut auf fremden Handys.</h1>
            <p className="hero-sub">
              Jedes Gästefoto, jedes Video, jede Nachricht landet an einem Ort — sofort sichtbar, für immer
              gesichert. Dazu, wenn ihr wollt: eine passende digitale Einladung im selben Design.
            </p>
            <div className="hero-cta">
              <a href="#preise" className="btn btn-primary">
                Fotos &amp; Videos sammeln
              </a>
              <a href="#vorlagen" className="btn btn-ghost">
                Auch Einladung gestalten
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
          <div className="stats-item">
            <div className="stats-num">{templates.length}</div>
            <div className="stats-label">Designs zur Auswahl</div>
          </div>
          <div className="stats-item">
            <div className="stats-num">0€</div>
            <div className="stats-label">Zum Ausprobieren, ohne Konto</div>
          </div>
          <div className="stats-item">
            <div className="stats-num">5&nbsp;Min.</div>
            <div className="stats-label">Bis eure Seite live ist</div>
          </div>
          <div className="stats-item">
            <div className="stats-num">1</div>
            <div className="stats-label">Link für Einladung, QR-Code &amp; Tischkarte</div>
          </div>
        </div>
      </section>

      <section className="how reveal" id="wie">
        <div className="how-head">
          <div className="eyebrow">Drei Schritte</div>
          <h2>So funktioniert&apos;s</h2>
        </div>
        <div className="how-grid">
          <div>
            <div className="how-num">01</div>
            <h3>Eventtyp &amp; Vorlage wählen</h3>
            <p>Ob Hochzeit, Geburtstag oder Firmenevent – passende Designs in mehreren Stimmungen.</p>
          </div>
          <div>
            <div className="how-num">02</div>
            <h3>Personalisieren</h3>
            <p>Daten, Farben, Module an- oder ausschalten: alles mit Live-Vorschau, in wenigen Minuten fertig.</p>
          </div>
          <div>
            <div className="how-num">03</div>
            <h3>Veröffentlichen &amp; teilen</h3>
            <p>Ein Link für eure Gäste, ein passender QR-Code für den Tisch – im selben Design.</p>
          </div>
        </div>
      </section>

      <section className="feature reveal" id="erinnerungen">
        <div className="feature-copy">
          <div className="eyebrow">Fotos, Videos &amp; Gästebuch</div>
          <h2>Alles, was eure Gäste festhalten — an einem Ort</h2>
          <p className="feature-desc">
            Gästefotos laufen automatisch in einer gemeinsamen Wand zusammen, dazu ein Video-Gästebuch für
            persönliche Botschaften. Ihr entscheidet vor der Veröffentlichung, was sichtbar wird.
          </p>
          <div className="feature-points">
            <div>
              <Check />
              Foto- &amp; Videowand ohne App-Zwang, direkt über den Browser
            </div>
            <div>
              <Check />
              Video-Gästebuch, bis 60 Sekunden
            </div>
            <div>
              <Check />
              Eigener QR-Code je Tisch — Uploads direkt vom Platz
            </div>
            <div>
              <Check />
              Personen-Tagging, damit jeder seine eigenen Fotos wiederfindet
            </div>
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
          <div className="eyebrow">{templates.length} Vorlagen</div>
          <h2>Für jede Stimmung die richtige</h2>
          <p>Bewusst kuratiert statt endlos – in Kategorien, damit ihr schnell findet, was zu euch passt.</p>
        </div>

        <TemplateGallery categories={galleryCategories} />
      </section>

      <section className="feature reveal" id="editor">
        <div className="feature-copy">
          <div className="eyebrow">Editor</div>
          <h2>Gestalten in Echtzeit</h2>
          <p className="feature-desc">
            Daten, Farbe, Schrift, Foto – alles mit sofortiger Vorschau. Probiert die Akzentfarbe links direkt aus.
          </p>
          <div className="feature-points">
            <div>
              <Check />
              Live-Vorschau reagiert direkt auf Eingaben
            </div>
            <div>
              <Check />
              Module pro Event einzeln an- oder ausschalten
            </div>
            <div>
              <Check />
              Passend für jeden Eventtyp, nicht nur Hochzeiten
            </div>
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
          <div className="eyebrow">Event-Webseite</div>
          <h2>Eine eigene Seite für euer Event</h2>
          <p className="feature-desc">
            Aus der Einladung wird eine eigene Event-Webseite: Countdown, Anfahrt, Ablauf und Zusage in einem Fluss.
          </p>
          <div className="feature-points">
            <div>
              <Check />
              Anfahrt inklusive Kartenvorschau
            </div>
            <div>
              <Check />
              Zeitstrahl mit allen Programmpunkten
            </div>
            <div>
              <Check />
              RSVP direkt mit Menüwahl
            </div>
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
          <div className="eyebrow">Teilen &amp; Drucken</div>
          <h2>Vom Scan zum Tisch</h2>
          <p className="feature-desc">
            Der Link teilt sich wie gewohnt – die Tischkarte ist der eigentliche Clou: automatisch im gewählten
            Design erzeugt, druckfertig, mit eigenem QR-Code je Tisch.
          </p>
          <div className="feature-points">
            <div>
              <Check />
              Teilen per WhatsApp oder Link
            </div>
            <div>
              <Check />
              Tischkarte im selben Design wie die Einladung
            </div>
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
          <div className="eyebrow">Preise</div>
          <h2>Nur Erinnerungen sammeln — oder die ganze Einladung</h2>
        </div>

        {photoVideoAddOn && (
          <div style={{ maxWidth: 420, margin: "0 auto 44px" }}>
            <div className="price-card highlight">
              <div className="price-badge">EIGENSTÄNDIG BUCHBAR</div>
              <h3 style={{ marginTop: 6 }}>{photoVideoAddOn.name}</h3>
              <div className="tag">Ganz ohne Einladung buchbar — nur Fotos, Videos &amp; Gästebuch</div>
              <div className="amount">{eur.format(photoVideoAddOn.priceCents / 100)}</div>
              <ul>
                <li>
                  <Check />
                  Unbegrenzte Foto- &amp; Video-Uploads
                </li>
                <li>
                  <Check />
                  Video-Gästebuch inklusive
                </li>
                <li>
                  <Check />
                  Personen-Tagging
                </li>
                <li>
                  <Check />
                  Unabhängig vom gewählten Paket, auch ohne Einladung
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="pricing-head" style={{ marginTop: 12 }}>
          <div className="eyebrow">Oder: die ganze Einladung</div>
          <h2 style={{ fontSize: "clamp(20px, 2.4vw, 26px)" }}>Für jeden Anlass die passende Stufe</h2>
        </div>
        <div className="price-grid">
          {packages.map((pkg) => {
            const features: string[] = JSON.parse(pkg.features);
            const highlight = pkg.key === "PREMIUM_PLUS";
            return (
              <div className={`price-card${highlight ? " highlight" : ""}`} key={pkg.id}>
                {highlight && <div className="price-badge">BELIEBTESTE WAHL</div>}
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
          Fotos, Videos &amp; Gästebuch digital sammeln — plus digitale Einladungen und Event-Webseiten für
          Hochzeiten, Geburtstage, Familienfeiern und Business-Events.
          <br />
          [KONTAKT E-MAIL] · © 2026 einladi
        </p>
      </footer>
    </>
  );
}
