import Link from "next/link";

export const metadata = { title: "Datenschutzerklärung – einladi", robots: { index: false, follow: false } };

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>{children}</div>
    </section>
  );
}

export default function DatenschutzPage() {
  return (
    <main style={{ background: "var(--ivory)", minHeight: "100vh", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Logo />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--ink)", marginBottom: 8 }}>
          Datenschutzerklärung
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 32 }}>Stand: September 2026</p>

        <Section title="Verantwortlicher">
          <p>
            Ismail Demir
            <br />
            Hansastr. 82, 27751 Delmenhorst
            <br />
            E-Mail:{" "}
            <a href="mailto:info@sonerdemir.de" style={{ color: "var(--terracotta-dark)" }}>
              info@sonerdemir.de
            </a>
          </p>
        </Section>

        <Section title="Hosting">
          <p>
            einladi wird bei Railway betrieben (Server-Infrastruktur in der EU). Datenbank und Anwendung laufen auf
            derselben Infrastruktur. Beim Aufruf der Seiten werden automatisch technische Verbindungsdaten
            (IP-Adresse, Zeitpunkt, aufgerufene Seite) kurzzeitig in Server-Logs verarbeitet, um den Betrieb sicher
            und stabil zu halten.
          </p>
        </Section>

        <Section title="Konto & Anmeldung">
          <p>
            Die Anmeldung erfolgt per Magic Link — ihr gebt eure E-Mail-Adresse ein und erhaltet einen Anmelde-Link
            per E-Mail, ein Passwort wird nicht gespeichert. Gespeichert werden E-Mail-Adresse und ein
            Sitzungstoken, solange euer Konto besteht.
          </p>
        </Section>

        <Section title="Transaktions-E-Mails">
          <p>
            Anmelde-Links, QR-Design-Versand und Bestätigungen zu Druckaufträgen verschicken wir über den
            Dienstleister Resend. Dabei werden Empfänger-E-Mail-Adresse und Inhalt der jeweiligen E-Mail an Resend
            übermittelt.
          </p>
        </Section>

        <Section title="Zahlungen">
          <p>
            Bezahlvorgänge (Einladungs-Pakete, Zusatzpakete, Druckaufträge) laufen vollständig über Stripe.
            Kartendaten oder sonstige Zahlungsinformationen laufen ausschließlich über Stripe und werden von uns
            nicht gespeichert.
          </p>
        </Section>

        <Section title="KI-Funktionen (optional)">
          <p>
            Wenn ihr aktiv eine KI-Funktion nutzt — Text-Assistent, Gästebuch-Übersetzung, Sitzplan-Vorschlag oder
            Foto-Kuration — wird der dafür nötige Text bzw. das Bild zur Verarbeitung an OpenAI (USA) übermittelt.
            Das passiert ausschließlich, wenn ihr diese Funktionen selbst auslöst, nicht automatisch im Hintergrund.
          </p>
        </Section>

        <Section title="Google Maps">
          <p>
            Ist für ein Event eine Standortanzeige aktiviert, wird die Karte über die Google Maps Embed- bzw.
            Places-API eingebunden. Dabei gelten die Datenschutzbestimmungen von Google. Ohne aktivierte
            Standort-Funktion wird keine Verbindung zu Google-Diensten aufgebaut.
          </p>
        </Section>

        <Section title="Von euch bereitgestellte Event-Inhalte">
          <p>
            Fotos, Videos und Gästebuch-Nachrichten, die Gäste zu einem Event hochladen, gehören weiterhin den
            jeweiligen Gästen bzw. dem Event-Ersteller — wir erwerben daran keine eigenen Rechte. Inhalte können vor
            der Veröffentlichung vom Event-Ersteller moderiert werden und sind ausschließlich über den
            individuellen Event-Link bzw. QR-Code erreichbar, nicht öffentlich auffindbar.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Wir setzen nur funktionale Cookies: eines für die Sprachauswahl (Deutsch/Türkisch) und eines für eure
            Anmelde-Sitzung, falls ihr ein Konto habt. Es werden keine Tracking- oder Analyse-Cookies von
            Drittanbietern eingesetzt.
          </p>
        </Section>

        <Section title="Eure Rechte">
          <p>
            Ihr habt jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung
            eurer Daten sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde. Wendet euch dazu einfach
            an die oben genannte E-Mail-Adresse.
          </p>
        </Section>

        <Link href="/" style={{ fontSize: 13, color: "var(--terracotta-dark)" }}>
          ← Zurück zur Startseite
        </Link>
      </div>
    </main>
  );
}
