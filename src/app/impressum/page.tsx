import Link from "next/link";

export const metadata = { title: "Impressum – einladi", robots: { index: false, follow: false } };

function Logo() {
  return (
    <Link href="/" className="logo">
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" stroke="var(--terracotta)" strokeWidth="1.4">
        <rect x="1" y="1" width="26" height="20" rx="1.5" />
        <path d="M1.5 2l12 9.5 12-9.5" />
      </svg>
      <span>einladi</span>
    </Link>
  );
}

export default function ImpressumPage() {
  return (
    <main style={{ background: "var(--ivory)", minHeight: "100vh", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Logo />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--ink)", marginBottom: 28 }}>
          Impressum
        </h1>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
            Angaben gemäß § 5 TMG
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink)" }}>
            Ismail Demir
            <br />
            Hansastr. 82
            <br />
            27751 Delmenhorst
            <br />
            Deutschland
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
            Kontakt
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink)" }}>
            Telefon: 01729915638
            <br />
            E-Mail:{" "}
            <a href="mailto:info@sonerdemir.de" style={{ color: "var(--terracotta-dark)" }}>
              info@sonerdemir.de
            </a>
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--ink)" }}>
            Ismail Demir (Anschrift wie oben)
          </p>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
            EU-Streitschlichtung
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "var(--ink-soft)" }}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--terracotta-dark)" }}
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            . Unsere E-Mail-Adresse findet sich oben. Wir sind nicht verpflichtet und nicht bereit, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <Link href="/" style={{ fontSize: 13, color: "var(--terracotta-dark)" }}>
          ← Zurück zur Startseite
        </Link>
      </div>
    </main>
  );
}
