import { prisma } from "@/lib/prisma";
import { RevealAnimator } from "@/components/marketing/RevealAnimator";
import { EditorPreview } from "@/components/marketing/EditorPreview";
import { TemplatePreview } from "@/components/marketing/TemplatePreview";
import { GuestPagePreview, SharePreview, GalleryPreview } from "@/components/marketing/PhoneMockups";

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
  const [templates, packages, modules] = await Promise.all([
    prisma.template.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
    prisma.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany(),
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
    "Türkische Feste & Bräuche": "Kına, Nişan, Sünnet und mehr – mit eigener Handschrift",
    Verspielt: "Fröhlich, bunt, verspielt",
    "Business Modern": "Klar, professionell, zeitgemäß",
  };

  return (
    <>
      <RevealAnimator />

      <nav>
        <Logo />
        <div className="nav-links">
          <a href="#vorlagen">Vorlagen</a>
          <a href="#editor">Editor</a>
          <a href="#preise">Preise</a>
          <a href="/dashboard">Anmelden</a>
        </div>
        <a href="/dashboard" className="btn btn-primary">
          Event gestalten
        </a>
      </nav>

      <section className="hero reveal">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Digitale Einladungen &amp; Event-Webseiten</div>
            <h1>Dein Event. Deine Geschichte. Digital.</h1>
            <p className="hero-sub">
              Digitale Einladungen und komplette Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und
              Business-Events – Design, Gästeliste und Erinnerungen an einem Ort.
            </p>
            <div className="hero-cta">
              <a href="#vorlagen" className="btn btn-primary">
                Event gestalten
              </a>
              <a href="#wie" className="btn btn-ghost">
                Wie funktioniert&apos;s?
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="name">Anna &amp; Lukas</div>
              <div className="rule" />
              <div className="meta">14. JUNI 2026 · SCHLOSS EHRENFELS</div>
            </div>
          </div>
        </div>
      </section>

      <section className="brandmark reveal">
        <div className="brandmark-head">
          <div className="eyebrow">Markenzeichen</div>
          <h2>Ein Zeichen, das ankommt</h2>
          <p>Ein Umschlag als Symbol – jede gute Feier beginnt mit einer Einladung, die ankommt.</p>
        </div>
        <div className="brandmark-grid">
          <div className="brandmark-tile light">
            <svg width="30" height="24" viewBox="0 0 28 22" fill="none" stroke="#B2543A" strokeWidth="1.4">
              <rect x="1" y="1" width="26" height="20" rx="1.5" />
              <path d="M1.5 2l12 9.5 12-9.5" />
            </svg>
            <span className="lockup-word" style={{ color: "#211C19" }}>
              einladi
            </span>
          </div>
          <div className="brandmark-tile dark">
            <svg width="30" height="24" viewBox="0 0 28 22" fill="none" stroke="#B9975B" strokeWidth="1.4">
              <rect x="1" y="1" width="26" height="20" rx="1.5" />
              <path d="M1.5 2l12 9.5 12-9.5" />
            </svg>
            <span className="lockup-word" style={{ color: "#FAF6EF" }}>
              einladi
            </span>
          </div>
          <div className="brandmark-tile alt">
            <div className="icon-tile">
              <svg width="34" height="27" viewBox="0 0 28 22" fill="none" stroke="#FAF6EF" strokeWidth="1.5">
                <rect x="1" y="1" width="26" height="20" rx="1.5" />
                <path d="M1.5 2l12 9.5 12-9.5" />
              </svg>
            </div>
          </div>
          <div className="brandmark-tile alt">
            <span className="lockup-word" style={{ color: "#211C19", fontSize: 30 }}>
              einladi
            </span>
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

      <section className="templates reveal" id="vorlagen">
        <div className="templates-head">
          <div className="eyebrow">{templates.length} Vorlagen</div>
          <h2>Für jede Stimmung die richtige</h2>
          <p>Bewusst kuratiert statt endlos – in Kategorien, damit ihr schnell findet, was zu euch passt.</p>
        </div>

        {[...templatesByCategory.entries()].map(([category, items]) => (
          <div className="cat" key={category}>
            <div className="cat-head">
              <h3>{category}</h3>
              <span className="cat-sub">{categorySubtitle[category] ?? ""}</span>
            </div>
            <div className="cat-grid">
              {items.map((t) => (
                <div className="tpl" key={t.id}>
                  <TemplatePreview layoutKey={t.layoutKey} />
                  <div className="tpl-label">
                    <span>{t.name}</span>
                    {t.priceCents > 0 && <span className="tpl-price">{eur.format(t.priceCents / 100)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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

      <section className="feature reveal">
        <div className="feature-copy">
          <div className="eyebrow">Erinnerungen</div>
          <h2>Live vom Event</h2>
          <p className="feature-desc">
            Gästefotos laufen in einer Wand zusammen, dazu ein Video-Gästebuch – alles vor der Veröffentlichung von
            euch freigegeben.
          </p>
          <div className="feature-points">
            <div>
              <Check />
              Foto- &amp; Videowand ohne App-Zwang
            </div>
            <div>
              <Check />
              Video-Gästebuch, bis 60 Sekunden
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

      <section className="pricing reveal" id="preise">
        <div className="pricing-head">
          <div className="eyebrow">Preise</div>
          <h2>Für jeden Anlass die passende Stufe</h2>
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
          Digitale Einladungen und Event-Webseiten für Hochzeiten, Geburtstage, Familienfeiern und Business-Events.
          <br />
          [KONTAKT E-MAIL] · © 2026 einladi
        </p>
      </footer>
    </>
  );
}
